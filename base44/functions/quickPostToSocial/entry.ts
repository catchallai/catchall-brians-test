import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, platforms } = await req.json();

    if (!content || !platforms || platforms.length === 0) {
      return Response.json(
        {
          error: 'Content and platforms required',
        },
        { status: 400 }
      );
    }

    const results = [];

    // Twitter posting
    if (platforms.includes('Twitter')) {
      const twitterToken = Deno.env.get('TWITTER_BEARER_TOKEN');
      if (twitterToken) {
        try {
          const response = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${twitterToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: content }),
          });

          if (response.ok) {
            const data = await response.json();
            results.push({
              platform: 'Twitter',
              success: true,
              id: data.data.id,
            });
          } else {
            const error = await response.text();
            results.push({
              platform: 'Twitter',
              success: false,
              error: `Failed to post: ${error}`,
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
          error: 'No Twitter credentials configured',
        });
      }
    }

    // LinkedIn posting
    if (platforms.includes('LinkedIn')) {
      try {
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('linkedin');

        if (!accessToken) {
          results.push({
            platform: 'LinkedIn',
            success: false,
            error: 'LinkedIn not connected. Go to Social Accounts to connect.',
          });
        } else {
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
                    text: content,
                  },
                  shareMediaCategory: 'NONE',
                },
              },
              visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
              },
            }),
          });

          if (postResponse.ok) {
            const postData = await postResponse.json();
            results.push({
              platform: 'LinkedIn',
              success: true,
              id: postData.id,
            });
          } else {
            const errorText = await postResponse.text();
            results.push({
              platform: 'LinkedIn',
              success: false,
              error: `Failed to post: ${errorText}`,
            });
          }
        }
      } catch (error) {
        results.push({
          platform: 'LinkedIn',
          success: false,
          error: error.message,
        });
      }
    }

    // Facebook & Instagram - placeholder
    if (platforms.includes('Facebook')) {
      results.push({
        platform: 'Facebook',
        success: false,
        error: 'Facebook API integration coming soon',
      });
    }

    if (platforms.includes('Instagram')) {
      results.push({
        platform: 'Instagram',
        success: false,
        error: 'Instagram API integration coming soon',
      });
    }

    return Response.json({ results });
  } catch (error) {
    console.error('Quick post error:', error);
    return Response.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
});
