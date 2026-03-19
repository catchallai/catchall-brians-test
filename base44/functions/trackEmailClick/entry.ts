import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Track link clicks and redirect
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get('id');
    const targetUrl = url.searchParams.get('url');

    if (!trackingId || !targetUrl) {
      return new Response('Invalid parameters', { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Find the email tracking record
    const trackingRecords = await base44.asServiceRole.entities.EmailTracking.filter({
      tracking_id: trackingId,
    });

    if (trackingRecords.length > 0) {
      const record = trackingRecords[0];
      const now = new Date().toISOString();

      // Update or add to clicked links
      const clickedLinks = record.clicked_links || [];
      const existingLink = clickedLinks.find((link) => link.url === targetUrl);

      if (existingLink) {
        existingLink.click_count = (existingLink.click_count || 0) + 1;
        existingLink.clicked_date = now;
      } else {
        clickedLinks.push({
          url: targetUrl,
          clicked_date: now,
          click_count: 1,
        });
      }

      // Update tracking record
      await base44.asServiceRole.entities.EmailTracking.update(record.id, {
        clicked: true,
        clicked_links: clickedLinks,
      });
    }

    // Redirect to target URL
    return Response.redirect(targetUrl, 302);
  } catch (error) {
    console.error('Click tracking error:', error);

    // Try to redirect anyway
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');
    if (targetUrl) {
      return Response.redirect(targetUrl, 302);
    }

    return new Response('Tracking error', { status: 500 });
  }
});
