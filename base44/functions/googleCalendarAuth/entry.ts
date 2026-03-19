import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const REDIRECT_URI =
  Deno.env.get('GOOGLE_REDIRECT_URI') || 'https://your-app.base44.app/oauth/google/callback';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, code, state } = await req.json();

    if (action === 'authorize') {
      // Generate authorization URL
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' ');

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${user.id}`;

      return Response.json({ authUrl });
    }

    if (action === 'callback' && code) {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        throw new Error('Failed to get access token');
      }

      // Get user's email
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userInfoResponse.json();

      // Calculate expiry time
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + (tokens.expires_in || 3600));

      // Update user with tokens
      await base44.auth.updateMe({
        google_calendar_connected: true,
        google_calendar_email: userInfo.email,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: expiryDate.toISOString(),
      });

      return Response.json({ success: true, email: userInfo.email });
    }

    if (action === 'refresh') {
      // Refresh access token
      if (!user.google_refresh_token) {
        throw new Error('No refresh token available');
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: user.google_refresh_token,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: 'refresh_token',
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        throw new Error('Failed to refresh token');
      }

      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + (tokens.expires_in || 3600));

      await base44.auth.updateMe({
        google_access_token: tokens.access_token,
        google_token_expiry: expiryDate.toISOString(),
      });

      return Response.json({ success: true, access_token: tokens.access_token });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Google Calendar auth error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
