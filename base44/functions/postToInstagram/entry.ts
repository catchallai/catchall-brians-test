import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CONNECTOR_ID = '69f82c4d431749a05bc401f5';
const GRAPH_URL = 'https://graph.facebook.com/v19.0';

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

    // Get Instagram OAuth token via app user connector
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);

    // Step 1: Get the Instagram Business Account ID via Facebook Graph API
    // The token from Instagram Business connector gives access to FB pages + linked IG accounts
    const pagesRes = await fetch(
      `${GRAPH_URL}/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesRes.ok || !pagesData.data) {
      return Response.json({
        error: 'Could not fetch Facebook Pages. Make sure your Instagram account is a Business or Creator account linked to a Facebook Page. Details: ' + (pagesData.error?.message || JSON.stringify(pagesData)),
      }, { status: 400 });
    }

    // Find the first page that has a linked Instagram Business account
    const pageWithIG = pagesData.data.find((p) => p.instagram_business_account?.id);
    if (!pageWithIG) {
      return Response.json({
        error: 'No Instagram Business account found. Please ensure your Instagram account is a Business or Creator account connected to a Facebook Page.',
      }, { status: 400 });
    }

    const igAccountId = pageWithIG.instagram_business_account.id;

    const caption = post.caption || post.content || '';
    const imageUrl = post.image_url || (Array.isArray(post.image_urls) ? post.image_urls[0] : null);
    const videoUrl = post.video_url || null;

    let containerId;

    if (videoUrl) {
      // Create a Reel container
      const params = new URLSearchParams({
        media_type: 'REELS',
        video_url: videoUrl,
        caption,
        access_token: accessToken,
      });
      const createRes = await fetch(`${GRAPH_URL}/${igAccountId}/media`, {
        method: 'POST',
        body: params,
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.id) {
        return Response.json({
          error: 'Failed to create video container: ' + (createData.error?.message || JSON.stringify(createData)),
        }, { status: 400 });
      }
      containerId = createData.id;

      // Poll for video processing (up to 60s)
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const statusRes = await fetch(
          `${GRAPH_URL}/${containerId}?fields=status_code&access_token=${accessToken}`
        );
        const statusData = await statusRes.json();
        if (statusData.status_code === 'FINISHED') break;
        if (statusData.status_code === 'ERROR') {
          return Response.json({ error: 'Video processing failed on Instagram.' }, { status: 400 });
        }
      }
    } else if (imageUrl) {
      // Create an image media container
      const params = new URLSearchParams({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      });
      const createRes = await fetch(`${GRAPH_URL}/${igAccountId}/media`, {
        method: 'POST',
        body: params,
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.id) {
        return Response.json({
          error: 'Failed to create image container: ' + (createData.error?.message || JSON.stringify(createData)),
        }, { status: 400 });
      }
      containerId = createData.id;
    } else {
      return Response.json({
        error: 'Instagram requires an image or video URL to publish a feed post.',
      }, { status: 400 });
    }

    // Step 2: Publish the container
    const publishParams = new URLSearchParams({
      creation_id: containerId,
      access_token: accessToken,
    });
    const publishRes = await fetch(`${GRAPH_URL}/${igAccountId}/media_publish`, {
      method: 'POST',
      body: publishParams,
    });
    const publishData = await publishRes.json();

    if (!publishRes.ok || !publishData.id) {
      return Response.json({
        error: 'Failed to publish to Instagram: ' + (publishData.error?.message || JSON.stringify(publishData)),
      }, { status: 400 });
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