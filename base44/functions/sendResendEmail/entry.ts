import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      to,
      subject,
      html,
      from = 'CatchAll <noreply@catchall.syberjet.com>',
    } = await req.json();

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return Response.json({ error: 'Resend API key not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error: 'Failed to send email',
          details: data,
        },
        { status: response.status }
      );
    }

    return Response.json({
      success: true,
      emailId: data.id,
      message: 'Email sent successfully',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
