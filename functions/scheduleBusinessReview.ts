import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contact_id, review_type, scheduled_date, csm_email } = await req.json();

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');
    
    const contacts = await base44.entities.Contact.list('-created_date', 500);
    const contact = contacts.find(c => c.id === contact_id);

    if (!contact) {
      return Response.json({ error: 'Contact not found' }, { status: 404 });
    }

    const eventTitle = `${review_type} Review - ${contact.first_name} ${contact.last_name}`;
    const eventStart = new Date(scheduled_date);
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000); // 1 hour

    const event = {
      summary: eventTitle,
      description: `Customer: ${contact.first_name} ${contact.last_name}\nCompany: ${contact.company || 'Unknown'}\nEmail: ${contact.email}\nPhone: ${contact.phone || 'N/A'}\n\nAgenda:\n- Customer success metrics\n- Product adoption review\n- Roadmap alignment\n- Action items`,
      start: {
        dateTime: eventStart.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: eventEnd.toISOString(),
        timeZone: 'UTC'
      },
      attendees: [
        { email: csm_email, responseStatus: 'accepted' },
        { email: contact.email, responseStatus: 'needsAction' }
      ]
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json({ error: error.message }, { status: 400 });
    }

    const calendarEvent = await response.json();

    // Create CSM task for review
    await base44.entities.CSMTask.create({
      contact_id,
      csm_assigned: csm_email,
      title: eventTitle,
      description: `Calendar event: ${calendarEvent.htmlLink}`,
      priority: 'high',
      status: 'open',
      task_type: review_type === 'Business' ? 'business_review' : 'health_check',
      due_date: scheduled_date.split('T')[0]
    });

    return Response.json({ 
      success: true,
      event_url: calendarEvent.htmlLink,
      event_id: calendarEvent.id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});