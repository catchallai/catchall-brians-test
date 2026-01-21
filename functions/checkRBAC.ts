import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { section, action = 'view' } = await req.json();

    if (!section) {
      return Response.json({ error: 'Section is required' }, { status: 400 });
    }

    // Get user department
    const departments = await base44.asServiceRole.entities.UserDepartment.filter({
      user_email: user.email
    });
    const userDept = departments[0];

    // Get user permissions based on role
    const permissions = await base44.asServiceRole.entities.RolePermission.filter({
      role: user.role || 'user',
      section: section
    });

    if (permissions.length === 0) {
      return Response.json({
        hasAccess: false,
        reason: 'No permissions found for this section'
      });
    }

    const permission = permissions[0];
    const actionMap = {
      'view': permission.can_view,
      'create': permission.can_create,
      'edit': permission.can_edit,
      'delete': permission.can_delete,
      'export': permission.can_export
    };

    const hasAccess = actionMap[action] || false;

    return Response.json({
      hasAccess,
      department: userDept?.department,
      role: user.role,
      permission
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});