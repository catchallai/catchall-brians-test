import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.google_calendar_connected || !user.google_access_token) {
      return Response.json({ error: 'Google Calendar not connected' }, { status: 400 });
    }

    const { summary, description, start, end, attendees, location } = await req.json();

    // Check if token is expired and refresh if needed
    let accessToken = user.google_access_token;
    if (user.google_token_expiry && new Date(user.google_token_expiry) < new Date()) {
      const refreshResponse = await base44.functions.invoke('googleCalendarAuth', {
        action: 'refresh',
      });
      accessToken = refreshResponse.data.access_token;
    }

    // Create calendar event
    const event = {
      summary,
      description,
      location,
      start: {
        dateTime: start,
        timeZone: 'UTC',
      },
      end: {
        dateTime: end,
        timeZone: 'UTC',
      },
      attendees: attendees?.map((email) => ({ email })) || [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create event');
    }

    return Response.json({
      success: true,
      eventId: data.id,
      eventLink: data.htmlLink,
    });
  } catch (error) {
    console.error('Create calendar event error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
