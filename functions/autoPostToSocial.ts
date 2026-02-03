import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    const results = [];
    const platforms = post.platforms || [];

    // Post to Twitter if included
    if (platforms.includes('Twitter') || platforms.includes('twitter')) {
      const twitterToken = Deno.env.get('TWITTER_BEARER_TOKEN');
      
      if (twitterToken) {
        try {
          const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${twitterToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: post.caption || post.content || ''
            })
          });

          if (tweetResponse.ok) {
            const tweetData = await tweetResponse.json();
            results.push({
              platform: 'Twitter',
              success: true,
              id: tweetData.data.id,
              url: `https://twitter.com/i/status/${tweetData.data.id}`
            });
          } else {
            const error = await tweetResponse.text();
            results.push({
              platform: 'Twitter',
              success: false,
              error: error
            });
          }
        } catch (error) {
          results.push({
            platform: 'Twitter',
            success: false,
            error: error.message
          });
        }
      } else {
        results.push({
          platform: 'Twitter',
          success: false,
          error: 'Twitter API token not configured'
        });
      }
    }

    // For other platforms (Instagram, Facebook, LinkedIn, YouTube)
    // These would require additional API setup
    const unsupportedPlatforms = platforms.filter(p => 
      !['Twitter', 'twitter'].includes(p)
    );
    
    unsupportedPlatforms.forEach(platform => {
      results.push({
        platform,
        success: false,
        error: 'Platform not yet supported. Please configure API access.'
      });
    });

    // Update post status
    const hasSuccessfulPost = results.some(r => r.success);
    await base44.asServiceRole.entities.CalendarPost.update(postId, {
      status: hasSuccessfulPost ? 'published' : 'failed',
      published_date: hasSuccessfulPost ? new Date().toISOString() : null,
      publish_results: results
    });

    return Response.json({
      success: hasSuccessfulPost,
      results,
      message: hasSuccessfulPost 
        ? 'Post published successfully' 
        : 'Failed to publish to any platform'
    });

  } catch (error) {
    console.error('Auto-post error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});