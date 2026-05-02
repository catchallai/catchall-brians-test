import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * SCIM 2.0 User Provisioning Endpoint
 * Handles user create/update/delete from identity providers
 */
Deno.serve(async (req) => {
  try {
    // Basic auth validation (use bearer token in production)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.role?.includes('admin')) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const method = req.method;
    const url = new URL(req.url);
    const path = url.pathname;

    // POST /scim/Users - Create user
    if (method === 'POST' && path === '/scim/Users') {
      const body = await req.json();
      const externalId = body.externalId || body.id;
      
      const scimUser = {
        external_id: externalId,
        email: body.userName || body.emails?.[0]?.value,
        username: body.userName,
        full_name: body.displayName,
        first_name: body.name?.givenName,
        last_name: body.name?.familyName,
        active: body.active !== false,
        department: body.department,
        title: body.title,
        roles: body.roles?.map((r) => r.value) || [],
        groups: body.groups?.map((g) => g.value) || [],
        identity_provider: 'SCIM',
        last_sync: new Date().toISOString(),
        sync_status: 'synced',
      };

      const created = await base44.asServiceRole.entities.SCIMUser.create(scimUser);
      
      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        event_type: 'scim_sync',
        actor_email: user.email,
        actor_id: user.id,
        resource_type: 'SCIMUser',
        resource_id: created.id,
        action: 'create_via_scim',
        status: 'success',
        details: { external_id: externalId },
        timestamp: new Date().toISOString(),
      });

      return Response.json(
        {
          schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
          id: created.id,
          externalId,
          userName: scimUser.email,
          displayName: scimUser.full_name,
          active: scimUser.active,
          meta: {
            resourceType: 'User',
            created: created.created_date,
            location: `/scim/Users/${created.id}`,
          },
        },
        { status: 201 }
      );
    }

    // PATCH /scim/Users/:id - Update user
    if (method === 'PATCH' && path.startsWith('/scim/Users/')) {
      const id = path.split('/').pop();
      const body = await req.json();

      const updates = {};
      if (body.Operations) {
        for (const op of body.Operations) {
          if (op.op === 'replace') {
            const path = op.path;
            if (path === 'active') updates.active = op.value;
            if (path === 'name.givenName') updates.first_name = op.value;
            if (path === 'name.familyName') updates.last_name = op.value;
            if (path.includes('roles')) updates.roles = op.value;
          }
        }
      }

      await base44.asServiceRole.entities.SCIMUser.update(id, {
        ...updates,
        last_sync: new Date().toISOString(),
        sync_status: 'synced',
      });

      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        event_type: 'scim_sync',
        actor_email: user.email,
        actor_id: user.id,
        resource_type: 'SCIMUser',
        resource_id: id,
        action: 'update_via_scim',
        status: 'success',
        details: updates,
        timestamp: new Date().toISOString(),
      });

      return Response.json({ id, status: 'synced' });
    }

    // DELETE /scim/Users/:id - Deactivate user
    if (method === 'DELETE' && path.startsWith('/scim/Users/')) {
      const id = path.split('/').pop();
      
      await base44.asServiceRole.entities.SCIMUser.update(id, {
        active: false,
        sync_status: 'synced',
      });

      // Audit log
      await base44.asServiceRole.entities.AuditLog.create({
        event_type: 'scim_sync',
        actor_email: user.email,
        actor_id: user.id,
        resource_type: 'SCIMUser',
        resource_id: id,
        action: 'deactivate_via_scim',
        status: 'success',
        timestamp: new Date().toISOString(),
      });

      return Response.json({}, { status: 204 });
    }

    // GET /scim/Users - List users (filtered)
    if (method === 'GET' && path === '/scim/Users') {
      const filter = url.searchParams.get('filter');
      let users = [];

      if (filter?.includes('userName')) {
        const email = filter.split('"')[1];
        users = await base44.asServiceRole.entities.SCIMUser.filter({ email });
      } else {
        users = await base44.asServiceRole.entities.SCIMUser.list('-created_date', 1000);
      }

      return Response.json({
        schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
        totalResults: users.length,
        itemsPerPage: users.length,
        startIndex: 1,
        Resources: users.map((u) => ({
          schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
          id: u.id,
          externalId: u.external_id,
          userName: u.email,
          displayName: u.full_name,
          active: u.active,
          meta: {
            resourceType: 'User',
            created: u.created_date,
          },
        })),
      });
    }

    return Response.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});