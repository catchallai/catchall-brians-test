import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, postId } = await req.json();
    
    if (!text) {
      return Response.json({ error: 'Text content required' }, { status: 400 });
    }

    // Get LinkedIn access token from app connector
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('linkedin');
    
    if (!accessToken) {
      return Response.json({ 
        error: 'LinkedIn not connected. Please authorize LinkedIn in Social Accounts.' 
      }, { status: 400 });
    }

    // Get user's LinkedIn profile ID (sub)
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
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
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
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
      url: postUrl
    });

  } catch (error) {
    console.error('LinkedIn post error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});