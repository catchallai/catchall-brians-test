import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { events, siteKey } = body;

    if (!events || !Array.isArray(events)) {
      return Response.json({ error: 'Invalid events data' }, { status: 400 });
    }

    // Validate siteKey if provided
    if (siteKey) {
      const keys = await base44.asServiceRole.entities.TrackingKey.filter({ key: siteKey, status: 'active' });
      if (keys.length === 0) {
        return Response.json({ error: 'Invalid or revoked site key' }, { status: 403 });
      }
      // Update last_seen and increment total_events
      const tk = keys[0];
      base44.asServiceRole.entities.TrackingKey.update(tk.id, {
        last_seen: new Date().toISOString(),
        total_events: (tk.total_events || 0) + events.length,
      }).catch(() => {});
    }

    // Sanitize events: ensure element_selector is always a string
    const sanitizedEvents = events.map(event => ({
      ...event,
      element_selector: event.element_selector && typeof event.element_selector === 'object'
        ? JSON.stringify(event.element_selector)
        : (typeof event.element_selector === 'string' ? event.element_selector : undefined),
    }));

    // Bulk insert all events using service role
    await base44.asServiceRole.entities.SessionEvent.bulkCreate(sanitizedEvents);

    return Response.json({
      success: true,
      events_saved: events.length,
    });
  } catch (error) {
    console.error('Session tracking error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});