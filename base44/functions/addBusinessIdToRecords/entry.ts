import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessId = user.current_business_id;
    if (!businessId) {
      return Response.json({ error: 'No business selected' }, { status: 400 });
    }

    // Get all companies without business_id
    const companiesWithoutBiz = await base44.asServiceRole.entities.Company.filter(
      { business_id: null },
      '-created_date',
      500
    );

    // Get all contacts without business_id
    const contactsWithoutBiz = await base44.asServiceRole.entities.Contact.filter(
      { business_id: null },
      '-created_date',
      1000
    );

    let companiesUpdated = 0;
    let contactsUpdated = 0;

    // Update companies
    for (const company of companiesWithoutBiz) {
      await base44.asServiceRole.entities.Company.update(company.id, { business_id: businessId });
      companiesUpdated++;
    }

    // Update contacts
    for (const contact of contactsWithoutBiz) {
      await base44.asServiceRole.entities.Contact.update(contact.id, { business_id: businessId });
      contactsUpdated++;
    }

    return Response.json({
      success: true,
      companiesUpdated,
      contactsUpdated,
      message: `Updated ${companiesUpdated} companies and ${contactsUpdated} contacts`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
