import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Resend webhook payload format
    const { from, to, subject, text, html, date, headers } = payload;

    // Create sales email record
    await base44.asServiceRole.entities.SalesEmail.create({
      from_email: from.email || from,
      from_name: from.name || null,
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
      priority: 'medium'
    });

    // Try to match with existing contact
    if (from.email || from) {
      const fromEmail = from.email || from;
      const contacts = await base44.asServiceRole.entities.Contact.filter({ 
        email: fromEmail 
      });

      if (contacts.length > 0) {
        // Update last contacted date
        await base44.asServiceRole.entities.Contact.update(contacts[0].id, {
          last_contacted: new Date().toISOString()
        });
      }
    }

    return Response.json({ 
      success: true,
      message: 'Email received and stored'
    });
  } catch (error) {
    console.error('Error processing email:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});