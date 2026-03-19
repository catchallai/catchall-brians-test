import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Send email with tracking via Resend
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { to, subject, html, contact_id, deal_id, sequence_enrollment_id } = body;

    if (!to || !subject || !html) {
      return Response.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    // Generate unique tracking ID
    const trackingId = crypto.randomUUID();

    // Get function URL for tracking pixel
    const functionUrl = Deno.env.get('DENO_DEPLOYMENT_ID')
      ? `https://${Deno.env.get('DENO_REGION')}.deno.dev`
      : 'http://localhost:8000';

    const trackingPixelUrl = `${functionUrl}/trackEmailOpen?id=${trackingId}`;
    const clickTrackUrl = `${functionUrl}/trackEmailClick?id=${trackingId}`;

    // Inject tracking pixel at end of HTML
    const trackedHtml =
      html + `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:block" />`;

    // Replace links with tracked links
    const finalHtml = trackedHtml.replace(
      /<a\s+href="([^"]+)"/g,
      (match, url) => `<a href="${clickTrackUrl}&url=${encodeURIComponent(url)}"`
    );

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: body.from || `noreply@${new URL(req.url).hostname}`,
        to,
        subject,
        html: finalHtml,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      return Response.json({ error: `Failed to send email: ${error}` }, { status: 500 });
    }

    const resendData = await resendResponse.json();

    // Create tracking record
    const trackingRecord = await base44.entities.EmailTracking.create({
      contact_id,
      deal_id,
      sequence_enrollment_id,
      subject,
      body: html,
      sent_date: new Date().toISOString(),
      tracking_id: trackingId,
      opened: false,
      opened_count: 0,
      clicked: false,
      replied: false,
      bounced: false,
    });

    return Response.json({
      success: true,
      tracking_id: trackingId,
      tracking_record_id: trackingRecord.id,
      resend_id: resendData.id,
    });
  } catch (error) {
    console.error('Send tracked email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
