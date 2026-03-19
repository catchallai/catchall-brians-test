import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const documentName = formData.get('name') || file.name;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload file to public storage
    const uploadResponse = await base44.integrations.Core.UploadFile({ file });
    const fileUrl = uploadResponse.file_url;

    // Generate a unique share token
    const shareToken = crypto
      .getRandomValues(new Uint8Array(16))
      .reduce((a, b) => a + b.toString(16), '');

    // Create TrackedDocument record
    const document = await base44.entities.TrackedDocument.create({
      name: documentName,
      file_url: fileUrl,
      tracking_code: shareToken,
      status: 'active',
      total_views: 0,
      total_downloads: 0,
    });

    return Response.json({
      success: true,
      documentId: document.id,
      trackingCode: shareToken,
      fileUrl: fileUrl,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
