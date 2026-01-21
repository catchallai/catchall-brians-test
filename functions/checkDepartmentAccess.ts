import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const DEPARTMENT_SECTIONS = {
  business_dev: ['dashboard', 'competitors', 'reports', 'activities'],
  sales: ['contacts', 'companies', 'deals', 'activities', 'campaigns', 'emailMarketing', 'reports', 'automation'],
  marketing: ['dashboard', 'seoDashboard', 'keywords', 'backlinks', 'seoAudit', 'socialMedia', 'socialListening', 'socialCalendar', 'hashtags', 'competitors', 'contentStudio', 'landing_pages', 'campaigns', 'emailMarketing', 'reports'],
  media: ['dashboard', 'seoDashboard', 'keywords', 'backlinks', 'seoAudit', 'socialMedia', 'socialListening', 'socialCalendar', 'hashtags', 'competitors', 'reports'],
  collaboration: ['dashboard', 'contacts', 'companies', 'deals', 'activities', 'campaigns', 'reports'],
  assets: ['contentStudio', 'landing_pages', 'reports'],
  executive: ['dashboard', 'reports'],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { section } = await req.json();

    if (!section) {
      return Response.json({ error: 'Section is required' }, { status: 400 });
    }

    // Get user department
    const departments = await base44.asServiceRole.entities.UserDepartment.filter({
      user_email: user.email
    });
    const userDept = departments[0];

    if (!userDept) {
      // No department assigned - check if section is public
      const publicSections = ['dashboard', 'help_center', 'reports'];
      return Response.json({
        hasAccess: publicSections.includes(section),
        department: null,
        reason: 'No department assigned'
      });
    }

    const allowedSections = DEPARTMENT_SECTIONS[userDept.department] || [];
    const hasAccess = allowedSections.includes(section);

    // For assets department, only allow view
    if (userDept.department === 'assets' && hasAccess) {
      return Response.json({
        hasAccess: true,
        department: userDept.department,
        viewOnly: true
      });
    }

    return Response.json({
      hasAccess,
      department: userDept.department,
      allowedSections
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});