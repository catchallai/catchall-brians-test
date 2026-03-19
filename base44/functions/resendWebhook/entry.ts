import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();
    const { type, data } = payload;

    console.log('Resend webhook received:', type, data);

    // Find the legal document by Resend email ID
    const documents = await base44.asServiceRole.entities.LegalDocument.filter({
      resend_email_id: data.email_id,
    });

    const document = documents?.[0];

    // Handle different webhook event types
    switch (type) {
      case 'email.sent':
        console.log('Email sent:', data.email_id);
        break;

      case 'email.delivered':
        console.log('Email delivered:', data.email_id);
        break;

      case 'email.delivery_delayed':
        console.log('Email delayed:', data.email_id);
        break;

      case 'email.complained':
        console.log('Email complaint:', data.email_id);
        break;

      case 'email.bounced':
        console.log('Email bounced:', data.email_id);
        if (document) {
          await base44.asServiceRole.entities.LegalDocument.update(document.id, {
            notes:
              (document.notes || '') + '\n[BOUNCED] Email bounced on ' + new Date().toISOString(),
          });
        }
        break;

      case 'email.opened':
        console.log('Email opened:', data.email_id);
        if (document && !document.email_opened) {
          // First time email was opened - update status to viewed
          await base44.asServiceRole.entities.LegalDocument.update(document.id, {
            status: 'viewed',
            email_opened: true,
            email_opened_date: new Date().toISOString(),
            viewed_date: new Date().toISOString(),
            view_count: (document.view_count || 0) + 1,
          });
          console.log('Document status updated to viewed:', document.id);
        } else if (document) {
          // Increment view count for subsequent opens
          await base44.asServiceRole.entities.LegalDocument.update(document.id, {
            view_count: (document.view_count || 0) + 1,
          });
        }
        break;

      case 'email.clicked':
        console.log('Email link clicked:', data.email_id);
        if (document && !document.email_clicked) {
          // First time link was clicked
          await base44.asServiceRole.entities.LegalDocument.update(document.id, {
            email_clicked: true,
            email_clicked_date: new Date().toISOString(),
          });
          console.log('Document email click tracked:', document.id);
        }
        break;

      default:
        console.log('Unknown webhook type:', type);
    }

    return Response.json({ success: true, received: type });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
