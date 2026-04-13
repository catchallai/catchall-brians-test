import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

class MediaValidationError extends Error {}

const normalizePostMedia = (post: {
  image_url?: string | null;
  image_urls?: string[] | null;
  video_url?: string | null;
}) => {
  const imageUrls =
    Array.isArray(post.image_urls) && post.image_urls.length > 0
      ? post.image_urls.filter(Boolean)
      : post.image_url
        ? [post.image_url]
        : [];
  const videoUrl = post.video_url || '';

  if (imageUrls.length > 0 && videoUrl) {
    throw new MediaValidationError('Posts cannot include both images and a video.');
  }

  return {
    image_urls: imageUrls,
    image_url: imageUrls[0] || '',
    video_url: videoUrl,
    media_type: videoUrl ? 'video' : imageUrls.length > 0 ? 'image' : 'none',
  };
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, postId, media } = await req.json();

    if (!text) {
      return Response.json({ error: 'Text content required' }, { status: 400 });
    }

    const hasProvidedMedia =
      !!media &&
      (Array.isArray(media.image_urls) ||
        'image_url' in media ||
        'image_urls' in media ||
        'video_url' in media);
    let normalizedMedia = normalizePostMedia(media || {});
    if (postId) {
      const posts = await base44.entities.CalendarPost.filter({ id: postId });
      const post = posts[0];
      if (!post) {
        return Response.json({ error: 'Post not found or not accessible' }, { status: 404 });
      }

      if (!hasProvidedMedia) {
        normalizedMedia = normalizePostMedia(post);
      }
    }

    // Get LinkedIn access token from app connector
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('linkedin');

    if (!accessToken) {
      return Response.json(
        {
          error: 'LinkedIn not connected. Please authorize LinkedIn in Social Accounts.',
        },
        { status: 400 }
      );
    }

    // Get user's LinkedIn profile ID (sub)
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to get LinkedIn profile');
    }

    const profile = await profileResponse.json();
    const authorUrn = `urn:li:person:${profile.sub}`;

    // Create a post on LinkedIn
    const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      throw new Error(`LinkedIn API error: ${errorText}`);
    }

    const postData = await postResponse.json();
    const postUrn = postData.id;
    const postUrl = `https://www.linkedin.com/feed/update/${postUrn}`;

    return Response.json({
      success: true,
      platform: 'LinkedIn',
      id: postUrn,
      url: postUrl,
      media: normalizedMedia,
    });
  } catch (error) {
    console.error('LinkedIn post error:', error);

    if (error instanceof MediaValidationError) {
      return Response.json(
        {
          success: false,
          error: error.message,
        },
        { status: 422 }
      );
    }

    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
});
