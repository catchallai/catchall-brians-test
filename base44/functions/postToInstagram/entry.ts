import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = '69f82c4d431749a05bc401f5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await req.json();
    if (!postId) {
      return Response.json({ error: 'postId required' }, { status: 400 });
    }

    // Get the post
    const posts = await base44.entities.CalendarPost.filter({ id: postId });
    const post = posts[0];
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get Instagram OAuth token for this app user
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Get Instagram user ID
    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    const meData = await meRes.json();
    if (!meRes.ok || !meData.id) {
      return Response.json({ error: 'Failed to get Instagram user: ' + (meData.error?.message || 'unknown') }, { status: 400 });
    }
    const igUserId = meData.id;

    const caption = post.caption || post.content || '';
    const imageUrl = post.image_url || (Array.isArray(post.image_urls) ? post.image_urls[0] : null);
    const videoUrl = post.video_url || null;

    let containerId;

    if (videoUrl) {
      // Reel
      const createRes = await fetch(`https://graph.instagram.com/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'REELS',
          video_url: videoUrl,
          caption,
          access_token: accessToken,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.id) {
        return Response.json({ error: 'Failed to create video container: ' + (createData.error?.message || JSON.stringify(createData)) }, { status: 400 });
      }
      containerId = createData.id;

      // Poll for video processing (up to 60s)
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const statusRes = await fetch(`https://graph.instagram.com/${containerId}?fields=status_code&access_token=${accessToken}`);
        const statusData = await statusRes.json();
        if (statusData.status_code === 'FINISHED') break;
        if (statusData.status_code === 'ERROR') {
          return Response.json({ error: 'Video processing failed' }, { status: 400 });
        }
      }
    } else if (imageUrl) {
      // Image post
      const createRes = await fetch(`https://graph.instagram.com/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: accessToken,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.id) {
        return Response.json({ error: 'Failed to create image container: ' + (createData.error?.message || JSON.stringify(createData)) }, { status: 400 });
      }
      containerId = createData.id;
    } else {
      return Response.json({ error: 'Instagram requires an image or video URL to publish a feed post.' }, { status: 400 });
    }

    // Publish the container
    const publishRes = await fetch(`https://graph.instagram.com/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    });
    const publishData = await publishRes.json();

    if (!publishRes.ok || !publishData.id) {
      return Response.json({ error: 'Failed to publish: ' + (publishData.error?.message || JSON.stringify(publishData)) }, { status: 400 });
    }

    const postUrl = `https://www.instagram.com/p/${publishData.id}/`;

    // Update CalendarPost status
    await base44.entities.CalendarPost.update(postId, {
      status: 'published',
      published_date: new Date().toISOString(),
      publish_results: [{ platform: 'Instagram', success: true, id: publishData.id, url: postUrl }],
    });

    return Response.json({ success: true, id: publishData.id, url: postUrl });
  } catch (error) {
    console.error('Instagram post error:', error);
    return Response.json({ error: error.message, success: false }, { status: 500 });
  }
});