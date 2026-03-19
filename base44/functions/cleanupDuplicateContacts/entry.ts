import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all contacts
    const allContacts = await base44.asServiceRole.entities.Contact.list('-created_date', 1000);

    // Track emails and IDs to delete
    const emailMap = {};
    const toDelete = [];
    let updated = 0;

    // Group by email and identify duplicates
    for (const contact of allContacts) {
      // Ensure all records have business_id
      if (!contact.business_id && user?.current_business_id) {
        await base44.asServiceRole.entities.Contact.update(contact.id, {
          business_id: user.current_business_id,
        });
        updated++;
      }

      // Track duplicates by email
      if (contact.email) {
        if (!emailMap[contact.email.toLowerCase()]) {
          emailMap[contact.email.toLowerCase()] = contact.id;
        } else {
          // Mark for deletion - keep the first one
          toDelete.push(contact.id);
        }
      }
    }

    // Delete duplicates
    for (const id of toDelete) {
      await base44.asServiceRole.entities.Contact.delete(id);
    }

    return Response.json({
      success: true,
      duplicatesRemoved: toDelete.length,
      recordsUpdated: updated,
      totalRecords: allContacts.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
