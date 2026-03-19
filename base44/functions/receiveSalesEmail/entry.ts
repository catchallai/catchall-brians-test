import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Handle both Gmail format and generic format
    const { from, to, subject, text, html, date, headers } = payload;

    // Extract email and name from various formats
    let fromEmail = '';
    let fromName = '';

    if (typeof from === 'string') {
      fromEmail = from;
    } else if (from && typeof from === 'object') {
      fromEmail = from.email || from.address || '';
      fromName = from.name || '';
    }

    // Create sales email record
    await base44.asServiceRole.entities.SalesEmail.create({
      from_email: fromEmail,
      from_name: fromName || null,
      to_email: to || 'sales@syberjet.com',
      subject: subject || '(no subject)',
      body: text || '',
      html_body: html || '',
      received_date: date || new Date().toISOString(),
      thread_id: headers?.['message-id'] || null,
      is_read: false,
      is_flagged: false,
      is_replied: false,
      status: 'new',
      priority: 'medium',
    });

    // Try to match with existing contact
    if (fromEmail) {
      const contacts = await base44.asServiceRole.entities.Contact.filter({
        email: fromEmail,
      });

      if (contacts.length > 0) {
        // Update last contacted date
        await base44.asServiceRole.entities.Contact.update(contacts[0].id, {
          last_contacted: new Date().toISOString(),
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Email received and stored',
    });
  } catch (error) {
    console.error('Error processing email:', error);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
});
