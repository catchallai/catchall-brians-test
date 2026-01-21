import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entityName, filters = {} } = await req.json();

    if (!entityName) {
      return Response.json({ error: 'entityName is required' }, { status: 400 });
    }

    // Get user's department
    const departments = await base44.asServiceRole.entities.UserDepartment.filter({ user_email: user.email });
    const userDept = departments[0]?.department;

    // Get user's section access
    const sectionAccess = await base44.asServiceRole.entities.UserSectionAccess.filter({ user_email: user.email });
    const sectionAccessMap = {};
    sectionAccess.forEach(access => {
      sectionAccessMap[access.section] = access.enabled;
    });

    // Check if user has access to this entity
    if (sectionAccessMap[entityName] === false) {
      return Response.json({ error: 'Access denied to this resource' }, { status: 403 });
    }

    // Call checkDepartmentAccess to validate
    const accessCheck = await base44.functions.invoke('checkDepartmentAccess', {
      entity: entityName,
      department: userDept
    });

    if (!accessCheck.data.allowed) {
      return Response.json({ error: 'Department does not have access to this resource' }, { status: 403 });
    }

    // Build query based on department and entity type
    let queryFilters = { ...filters };

    // Department-specific filtering
    if (userDept === 'sales') {
      // Sales can only see contacts and deals they're assigned to (or all if no assignment field)
      if (entityName === 'Contact' || entityName === 'Deal') {
        // Could add: queryFilters.assigned_to = user.email;
      }
    } else if (userDept === 'marketing') {
      // Marketing can see campaigns, contacts, and their own data
      if (entityName === 'Campaign' || entityName === 'EmailCampaign') {
        queryFilters.created_by = user.email;
      }
    } else if (userDept === 'business_dev') {
      // Business dev can see all contacts and companies
    }

    // Fetch data using service role
    const data = await base44.asServiceRole.entities[entityName].filter(queryFilters, '-updated_date', 1000);

    return Response.json({
      success: true,
      data,
      department: userDept
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});