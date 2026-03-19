import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get LinkedIn access token from app connector
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('linkedin');

    if (!accessToken) {
      return Response.json({
        success: false,
        error: 'LinkedIn not authorized. Please authorize in Settings.',
      });
    }

    // Get user's LinkedIn profile info
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      throw new Error(`Failed to get LinkedIn profile: ${errorText}`);
    }

    const profile = await profileResponse.json();

    return Response.json({
      success: true,
      name: profile.name || profile.given_name || 'LinkedIn User',
      email: profile.email,
      profileUrl: `https://www.linkedin.com/in/${profile.sub}`,
      sub: profile.sub,
    });
  } catch (error) {
    console.error('LinkedIn verification error:', error);
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
});
