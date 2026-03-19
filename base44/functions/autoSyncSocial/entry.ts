import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all social accounts
    const accounts = await base44.asServiceRole.entities.SocialAccount.list('-created_date', 100);

    const results = {
      total: accounts.length,
      synced: 0,
      failed: 0,
      errors: [],
    };

    for (const account of accounts) {
      try {
        const platformName = account.platform === 'twitter' ? 'X (Twitter)' : account.platform;

        // Analyze account with AI
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Search for the ${platformName} account "${account.account_name}".
          ${account.account_url ? `URL: ${account.account_url}` : ''}

Find: followers_count, engagement_rate, total_posts.
Find 5 recent posts with: post_url, content, post_date, likes, comments, shares, views, sentiment, topics (array of 3 keywords).`,
          add_context_from_internet: true,
          response_json_schema: {
            type: 'object',
            properties: {
              followers_count: { type: 'number' },
              engagement_rate: { type: 'number' },
              total_posts: { type: 'number' },
              posts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    post_url: { type: 'string' },
                    content: { type: 'string' },
                    post_date: { type: 'string' },
                    likes: { type: 'number' },
                    comments: { type: 'number' },
                    shares: { type: 'number' },
                    views: { type: 'number' },
                    sentiment: { type: 'string' },
                    topics: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        });

        // Update account
        const updateData = { last_analyzed: new Date().toISOString() };
        if (analysis.followers_count && analysis.followers_count > 0) {
          updateData.followers_count = analysis.followers_count;
        }
        if (analysis.engagement_rate && analysis.engagement_rate > 0) {
          updateData.engagement_rate = analysis.engagement_rate;
        }
        if (analysis.total_posts && analysis.total_posts > 0) {
          updateData.posts_count = analysis.total_posts;
        }

        await base44.asServiceRole.entities.SocialAccount.update(account.id, updateData);

        // Update posts
        if (analysis.posts && analysis.posts.length > 0) {
          const currentPosts = await base44.asServiceRole.entities.SocialPost.filter({
            social_account_id: account.id,
          });

          for (const post of currentPosts) {
            await base44.asServiceRole.entities.SocialPost.delete(post.id);
          }

          for (const post of analysis.posts) {
            const postId = post.post_url
              ? post.post_url.split('/').pop()
              : `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await base44.asServiceRole.entities.SocialPost.create({
              social_account_id: account.id,
              platform: account.platform,
              post_id: postId,
              post_url: post.post_url || '',
              content: post.content,
              post_date: post.post_date
                ? new Date(post.post_date).toISOString()
                : new Date().toISOString(),
              likes: post.likes || 0,
              comments: post.comments || 0,
              shares: post.shares || 0,
              views: post.views || 0,
              sentiment: post.sentiment || 'neutral',
              topics: post.topics || [],
              engagement_rate: analysis.engagement_rate || 0,
              hashtags: post.hashtags || [],
            });
          }
        }

        results.synced++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          account: account.account_name,
          error: error.message,
        });
      }
    }

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error) {
    console.error('Auto-sync error:', error);
    return Response.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
});
