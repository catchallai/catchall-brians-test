import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Serve tracking pixel and record email open
Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const trackingId = url.searchParams.get('id');

    if (!trackingId) {
      return new Response('Invalid tracking ID', { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Find the email tracking record
    const trackingRecords = await base44.asServiceRole.entities.EmailTracking.filter({
      tracking_id: trackingId,
    });

    if (trackingRecords.length > 0) {
      const record = trackingRecords[0];
      const now = new Date().toISOString();

      // Update tracking record
      await base44.asServiceRole.entities.EmailTracking.update(record.id, {
        opened: true,
        opened_count: (record.opened_count || 0) + 1,
        first_opened_date: record.first_opened_date || now,
        last_opened_date: now,
      });
    }

    // Return 1x1 transparent pixel
    const pixel = Uint8Array.from(
      atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
      (c) => c.charCodeAt(0)
    );

    return new Response(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Email tracking error:', error);

    // Still return pixel even on error
    const pixel = Uint8Array.from(
      atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
      (c) => c.charCodeAt(0)
    );
    return new Response(pixel, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
});
