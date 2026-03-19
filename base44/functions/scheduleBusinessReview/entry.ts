import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const {
      contact_id,
      contact_name,
      contact_email,
      title,
      scheduled_date,
      duration_minutes = 60,
    } = await req.json();

    if (!scheduled_date) {
      return Response.json({ error: 'scheduled_date is required' }, { status: 422 });
    }
    const scheduledAt = new Date(scheduled_date);
    if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      return Response.json({ error: 'Scheduled time must be in the future' }, { status: 422 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    const startTime = new Date(scheduled_date);
    const endTime = new Date(startTime.getTime() + duration_minutes * 60000);

    const event = {
      summary: title || `Business Review - ${contact_name}`,
      description: `Customer Success Business Review\n\nContact: ${contact_name}\nEmail: ${contact_email}`,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: [
        {
          email: contact_email,
          responseStatus: 'needsAction',
        },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 1440 },
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create calendar event');
    }

    const calendarEvent = await response.json();

    return Response.json({
      success: true,
      event_id: calendarEvent.id,
      event_url: calendarEvent.htmlLink,
      message: `Business review scheduled for ${contact_name}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
