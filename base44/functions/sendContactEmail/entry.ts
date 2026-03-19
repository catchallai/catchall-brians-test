import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, body, from_email } = await req.json();

    if (!to || !subject || !body || !from_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return Response.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: from_email,
        to: to,
        subject: subject,
        html: body,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      return Response.json({ error: 'Failed to send email', details: error }, { status: 500 });
    }

    const result = await emailResponse.json();
    return Response.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('Error sending email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
