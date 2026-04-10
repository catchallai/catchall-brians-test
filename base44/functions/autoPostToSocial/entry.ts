import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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
  const hasVideo = Boolean(videoUrl);
  const normalizedImageUrls = hasVideo ? [] : imageUrls;

  return {
    image_urls: normalizedImageUrls,
    image_url: normalizedImageUrls[0] || '',
    video_url: hasVideo ? videoUrl : '',
    media_type: hasVideo ? 'video' : normalizedImageUrls.length > 0 ? 'image' : 'none',
  };
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await req.json();

    if (!postId) {
      return Response.json({ error: 'Post ID required' }, { status: 400 });
    }

    // Get the post
    const posts = await base44.entities.CalendarPost.filter({ id: postId });
    const post = posts[0];

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const normalizedMedia = normalizePostMedia(post);

    const results = [];
    const platforms = post.platforms || [];

    // Get connected social accounts
    const socialAccounts = await base44.asServiceRole.entities.SocialAccount.filter({
      is_active: true,
    });

    // Post to Twitter if included
    if (platforms.includes('Twitter') || platforms.includes('twitter')) {
      const twitterAccount = socialAccounts.find((a) => a.platform === 'Twitter');
      const twitterToken =
        twitterAccount?.credentials?.access_token ||
        twitterAccount?.credentials?.bearer_token ||
        Deno.env.get('TWITTER_BEARER_TOKEN');

      if (twitterToken) {
        try {
          const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${twitterToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: post.caption || post.content || '',
            }),
          });

          if (tweetResponse.ok) {
            const tweetData = await tweetResponse.json();
            results.push({
              platform: 'Twitter',
              success: true,
              id: tweetData.data.id,
              url: `https://twitter.com/i/status/${tweetData.data.id}`,
            });
          } else {
            const error = await tweetResponse.text();
            results.push({
              platform: 'Twitter',
              success: false,
              error: error,
            });
          }
        } catch (error) {
          results.push({
            platform: 'Twitter',
            success: false,
            error: error.message,
          });
        }
      } else {
        results.push({
          platform: 'Twitter',
          success: false,
          error: 'Twitter API token not configured',
        });
      }
    }

    // LinkedIn posting
    if (platforms.includes('LinkedIn')) {
      const linkedinAccount = socialAccounts.find((a) => a.platform === 'LinkedIn');
      if (linkedinAccount) {
        try {
          const response = await base44.asServiceRole.functions.invoke('postToLinkedIn', {
            text: post.caption || post.content || '',
            postId: postId,
            media: normalizedMedia,
          });

          if (response.data.success) {
            results.push({
              platform: 'LinkedIn',
              success: true,
              id: response.data.id,
              url: response.data.url,
            });
          } else {
            results.push({
              platform: 'LinkedIn',
              success: false,
              error: response.data.error || 'Failed to post',
            });
          }
        } catch (error) {
          results.push({
            platform: 'LinkedIn',
            success: false,
            error: error.message,
          });
        }
      } else {
        results.push({
          platform: 'LinkedIn',
          success: false,
          error: 'No LinkedIn account connected. Go to Social Accounts to connect.',
        });
      }
    }

    // Facebook posting
    if (platforms.includes('Facebook')) {
      const facebookAccount = socialAccounts.find((a) => a.platform === 'Facebook');
      if (facebookAccount?.credentials?.access_token) {
        results.push({
          platform: 'Facebook',
          success: false,
          error: 'Facebook API integration coming soon',
        });
      } else {
        results.push({
          platform: 'Facebook',
          success: false,
          error: 'No Facebook account connected. Go to Social Accounts to connect.',
        });
      }
    }

    // Instagram posting
    if (platforms.includes('Instagram')) {
      const instagramAccount = socialAccounts.find((a) => a.platform === 'Instagram');
      if (instagramAccount?.credentials?.access_token) {
        results.push({
          platform: 'Instagram',
          success: false,
          error: 'Instagram API integration coming soon',
        });
      } else {
        results.push({
          platform: 'Instagram',
          success: false,
          error: 'No Instagram account connected. Go to Social Accounts to connect.',
        });
      }
    }

    // YouTube posting
    if (platforms.includes('YouTube')) {
      const youtubeAccount = socialAccounts.find((a) => a.platform === 'YouTube');
      if (youtubeAccount?.credentials?.access_token) {
        results.push({
          platform: 'YouTube',
          success: false,
          error: 'YouTube API integration coming soon',
        });
      } else {
        results.push({
          platform: 'YouTube',
          success: false,
          error: 'No YouTube account connected. Go to Social Accounts to connect.',
        });
      }
    }

    // Update post status
    const hasSuccessfulPost = results.some((r) => r.success);
    await base44.asServiceRole.entities.CalendarPost.update(postId, {
      status: hasSuccessfulPost ? 'published' : 'failed',
      published_date: hasSuccessfulPost ? new Date().toISOString() : null,
      publish_results: results,
    });

    return Response.json({
      success: hasSuccessfulPost,
      results,
      message: hasSuccessfulPost
        ? 'Post published successfully'
        : 'Failed to publish to any platform',
    });
  } catch (error) {
    console.error('Auto-post error:', error);
    return Response.json(
      {
        error: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
});
