import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const payload = await req.json();
    const { type, data } = payload;

    // Log the webhook event
    console.log('Resend webhook received:', type, data);

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
        break;
      
      case 'email.opened':
        console.log('Email opened:', data.email_id);
        break;
      
      case 'email.clicked':
        console.log('Email link clicked:', data.email_id);
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