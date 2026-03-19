import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Parse incoming events
    const { events } = await req.json();

    if (!events || !Array.isArray(events)) {
      return Response.json({ error: 'Invalid events data' }, { status: 400 });
    }

    // Bulk insert all events using service role
    await base44.asServiceRole.entities.SessionEvent.bulkCreate(events);

    return Response.json({
      success: true,
      events_saved: events.length,
    });
  } catch (error) {
    console.error('Session tracking error:', error);
    return Response.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
});
