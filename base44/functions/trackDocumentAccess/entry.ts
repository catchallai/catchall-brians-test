import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const trackingCode = url.searchParams.get('code');
    const action = url.searchParams.get('action') || 'view';

    if (!trackingCode) {
      return Response.json({ error: 'Tracking code required' }, { status: 400 });
    }

    // Find document by tracking code
    const documents = await base44.asServiceRole.entities.TrackedDocument.filter({
      tracking_code: trackingCode,
    });

    if (!documents || documents.length === 0) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const document = documents[0];

    // Check if expired
    if (document.expires_at && new Date(document.expires_at) < new Date()) {
      return Response.json({ error: 'Document has expired' }, { status: 403 });
    }

    // Get request info
    const ipAddress =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Create access log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: action,
      ip_address: ipAddress,
      user_agent: userAgent,
      location: 'Unknown',
    };

    // Update document with new access log
    const updatedLogs = [...(document.access_logs || []), logEntry];
    const updateData = {
      access_logs: updatedLogs,
      last_viewed_at: new Date().toISOString(),
    };

    if (action === 'view') {
      updateData.total_views = (document.total_views || 0) + 1;
    } else if (action === 'download') {
      updateData.total_downloads = (document.total_downloads || 0) + 1;
    }

    await base44.asServiceRole.entities.TrackedDocument.update(document.id, updateData);

    // Return the PDF file URL for redirect
    return Response.json({
      file_url: document.file_url,
      action: action,
      tracked: true,
    });
  } catch (error) {
    console.error('Tracking error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
