import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id, company_name, website } = await req.json();

    if (!company_id || !company_name) {
      return Response.json({ error: 'Missing company_id or company_name' }, { status: 400 });
    }

    // Build search query
    const searchQuery = website
      ? `Find detailed information about ${company_name} (${website}): company description, industry, headquarters location, company size, annual revenue, contact information including phone numbers and email addresses.`
      : `Find detailed information about ${company_name}: company description, industry, headquarters location, website, company size, annual revenue, contact information including phone numbers and email addresses.`;

    // Search internet for company data
    const enrichedData = await base44.integrations.Core.InvokeLLM({
      prompt: searchQuery,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          industry: { type: 'string' },
          website: { type: 'string' },
          hq_city: { type: 'string' },
          country: { type: 'string' },
          address: { type: 'string' },
          size: { type: 'string' },
          annual_revenue: { type: 'number' },
          phone: { type: 'string' },
          general_emails: {
            type: 'array',
            items: { type: 'string' },
          },
          general_phones: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    });

    // Update company with enriched data
    const updateData = {};

    if (enrichedData.description) updateData.description = enrichedData.description;
    if (enrichedData.industry) updateData.industry = enrichedData.industry;
    if (enrichedData.website && !website) updateData.website = enrichedData.website;
    if (enrichedData.hq_city) updateData.hq_city = enrichedData.hq_city;
    if (enrichedData.country) updateData.country = enrichedData.country;
    if (enrichedData.address) updateData.address = enrichedData.address;
    if (enrichedData.size) updateData.size = enrichedData.size;
    if (enrichedData.annual_revenue) updateData.annual_revenue = enrichedData.annual_revenue;
    if (enrichedData.phone) updateData.phone = enrichedData.phone;
    if (enrichedData.general_emails && enrichedData.general_emails.length > 0) {
      updateData.general_emails = enrichedData.general_emails;
    }
    if (enrichedData.general_phones && enrichedData.general_phones.length > 0) {
      updateData.general_phones = enrichedData.general_phones;
    }

    // Only update if we have data
    if (Object.keys(updateData).length > 0) {
      await base44.asServiceRole.entities.Company.update(company_id, updateData);
    }

    return Response.json({
      success: true,
      enriched_fields: Object.keys(updateData),
      data: updateData,
    });
  } catch (error) {
    console.error('Error enriching company:', error);
    return Response.json(
      {
        error: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
});
