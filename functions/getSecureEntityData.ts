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

    // Fetch all data - all users can see all data
    const data = await base44.asServiceRole.entities[entityName].filter(filters, '-updated_date', 1000);

    return Response.json({
      success: true,
      data,
      department: userDept
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});