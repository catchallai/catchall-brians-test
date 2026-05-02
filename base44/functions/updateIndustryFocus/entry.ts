import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { industry, scanner_label, company_name, primary_color, tagline } =
      await req.json();

    if (!industry) {
      return Response.json(
        { error: 'Missing required field: industry' },
        { status: 400 }
      );
    }

    // Get or create company settings
    const settings = await base44.entities.CompanySettings.list();
    const companySetting = settings.length > 0 ? settings[0] : null;

    const data = {
      industry,
      scanner_label:
        scanner_label ||
        `${industry.charAt(0).toUpperCase() + industry.slice(1)} Intelligence`,
      ...(company_name && { company_name }),
      ...(primary_color && { primary_color }),
      ...(tagline && { tagline }),
    };

    let result;
    if (companySetting) {
      result = await base44.entities.CompanySettings.update(companySetting.id, data);
    } else {
      result = await base44.entities.CompanySettings.create({
        company_name: company_name || 'CatchAll',
        ...data,
      });
    }

    return Response.json({
      status: 'success',
      message: `Industry focus updated to ${industry}`,
      data: result,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});