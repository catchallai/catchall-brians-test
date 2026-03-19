import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await req.json();

    if (!username) {
      return Response.json({ error: 'Username required' }, { status: 400 });
    }

    const bearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');

    if (!bearerToken) {
      return Response.json(
        {
          error:
            'Twitter API not configured. Please add TWITTER_BEARER_TOKEN in Settings > Secrets',
        },
        { status: 500 }
      );
    }

    // Remove @ if present
    const cleanUsername = username.replace('@', '');

    // Get user info by username
    const userResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${cleanUsername}?user.fields=public_metrics,description,created_at,protected`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    if (!userResponse.ok) {
      const error = await userResponse.json();
      return Response.json(
        {
          error: `Twitter API error: ${error.detail || error.title || 'Failed to fetch user'}`,
          details: error,
        },
        { status: userResponse.status }
      );
    }

    const userData = await userResponse.json();

    if (!userData.data) {
      return Response.json(
        {
          error: `User @${cleanUsername} not found`,
        },
        { status: 404 }
      );
    }

    const userId = userData.data.id;
    const metrics = userData.data.public_metrics;
    const isProtected = userData.data.protected;

    // Get recent tweets (skip if protected)
    let tweets = [];
    if (!isProtected) {
      const tweetsResponse = await fetch(
        `https://api.twitter.com/2/users/${userId}/tweets?max_results=10&tweet.fields=public_metrics,created_at,entities&expansions=attachments.media_keys&media.fields=url`,
        {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        }
      );

      const tweetsData = (await tweetsResponse.ok) ? await tweetsResponse.json() : { data: [] };
      tweets = tweetsData.data || [];
    }

    // Calculate engagement rate
    const totalEngagements = tweets.reduce((sum, tweet) => {
      const m = tweet.public_metrics;
      return sum + (m.like_count + m.reply_count + m.retweet_count + m.quote_count);
    }, 0);

    const totalImpressions = tweets.reduce((sum, tweet) => {
      return sum + (tweet.public_metrics.impression_count || 0);
    }, 0);

    const engagementRate =
      totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100).toFixed(2) : 0;

    // Format posts
    const posts = tweets.map((tweet) => {
      const m = tweet.public_metrics;
      const totalEng = m.like_count + m.reply_count + m.retweet_count;

      // Extract hashtags
      const hashtags = tweet.entities?.hashtags?.map((h) => h.tag) || [];

      // Simple sentiment based on engagement ratio
      let sentiment = 'neutral';
      if (m.like_count > m.reply_count * 3) sentiment = 'positive';
      if (m.reply_count > m.like_count * 2) sentiment = 'negative';

      return {
        post_url: `https://twitter.com/${cleanUsername}/status/${tweet.id}`,
        content: tweet.text,
        post_date: tweet.created_at,
        likes: m.like_count,
        comments: m.reply_count,
        shares: m.retweet_count + m.quote_count,
        views: m.impression_count || 0,
        sentiment: sentiment,
        topics: hashtags.slice(0, 3),
        hashtags: hashtags,
      };
    });

    return Response.json({
      success: true,
      followers_count: metrics.followers_count,
      following_count: metrics.following_count,
      engagement_rate: parseFloat(engagementRate),
      total_posts: metrics.tweet_count,
      is_protected: isProtected,
      posts: posts,
      note: isProtected ? 'Account is protected - tweets not available' : null,
    });
  } catch (error) {
    console.error('Twitter API error:', error);
    return Response.json(
      {
        error: error.message,
        details: 'Make sure TWITTER_BEARER_TOKEN is set correctly',
      },
      { status: 500 }
    );
  }
});
