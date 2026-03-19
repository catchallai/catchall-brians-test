import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await req.json();

    // Stage mapping
    const stageMapping = {
      '🚨New Lead': 'new_lead',
      '📧 Email List': 'email_list',
      '🎥 Media Inquiry': 'media_inquiry',
      '🚨 Reservation Request': 'reservation_request',
      'No Response - Follow Up': 'no_response',
      '✅ Contacted': 'contacted',
      '✅ Closed': 'closed',
      '❌ Not Interested': 'not_interested',
    };

    const imported = [];
    const errors = [];

    for (const row of data) {
      try {
        // Map stage value
        let stage = stageMapping[row.stage] || 'new_lead';

        // Parse tags if they exist
        let tags = [];
        if (row.tags) {
          tags = row.tags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t);
        }

        const opportunityData = {
          business_id: user.current_business_id,
          title: row['Opportunity Name'] || row.email || 'Untitled',
          contact_name: row['Contact Name'] || '',
          contact_email: row.email || '',
          contact_phone: row.phone || '',
          stage: stage,
          source: row.source || '',
          value: parseFloat(row['Lead Value']) || 0,
          notes: row.Notes || '',
          tags: tags,
          priority: 'medium',
        };

        const created = await base44.entities.Opportunity.create(opportunityData);
        imported.push(created);
      } catch (error) {
        errors.push({
          row: row['Opportunity Name'] || row.email,
          error: error.message,
        });
      }
    }

    return Response.json({
      success: true,
      imported: imported.length,
      errors: errors.length,
      errorDetails: errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
