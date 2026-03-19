import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow anonymous tracking (no auth required)
    const body = await req.json();
    const { sessionId, page, referrer, timeSpent, scrollDepth, device, browser, isNewSession } =
      body;

    // Get visitor IP and location
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Hash IP for privacy
    const hashedIp = await crypto.subtle
      .digest('SHA-256', new TextEncoder().encode(ip))
      .then((buf) =>
        Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      );

    // Get location data from IP (using ipapi.co)
    let locationData = {
      city: 'Unknown',
      country: 'Unknown',
      company: 'Unknown',
      industry: 'Technology',
    };
    try {
      const locationResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      if (locationResponse.ok) {
        const data = await locationResponse.json();
        locationData = {
          city: data.city || 'Unknown',
          country: data.country_name || 'Unknown',
          company: data.org || 'Unknown Visitor',
          industry: 'Technology',
        };
      }
    } catch (e) {
      console.error('Location lookup failed:', e);
    }

    // Find or create visitor session
    const existingSessions = await base44.asServiceRole.entities.VisitorSession.filter({
      session_id: sessionId,
    });

    let session;
    if (existingSessions.length > 0) {
      session = existingSessions[0];

      // Update existing session
      const journey = session.journey || [];
      journey.push({
        page,
        timestamp: new Date().toISOString(),
        time_spent: timeSpent || 0,
        scroll_depth: scrollDepth || 0,
      });

      await base44.asServiceRole.entities.VisitorSession.update(session.id, {
        pages_viewed: (session.pages_viewed || 0) + 1,
        time_on_site: (session.time_on_site || 0) + (timeSpent || 0),
        exit_page: page,
        journey,
        session_end: new Date().toISOString(),
      });
    } else {
      // Create new session
      session = await base44.asServiceRole.entities.VisitorSession.create({
        session_id: sessionId,
        visitor_ip: hashedIp,
        ...locationData,
        pages_viewed: 1,
        time_on_site: timeSpent || 0,
        device: device || 'Desktop',
        browser: browser || 'Unknown',
        referrer: referrer || 'Direct',
        entry_page: page,
        exit_page: page,
        journey: [
          {
            page,
            timestamp: new Date().toISOString(),
            time_spent: timeSpent || 0,
            scroll_depth: scrollDepth || 0,
          },
        ],
        is_returning: !isNewSession,
        visit_count: 1,
        session_start: new Date().toISOString(),
        session_end: new Date().toISOString(),
      });
    }

    return Response.json({
      success: true,
      sessionId: session.session_id,
    });
  } catch (error) {
    console.error('Tracking error:', error);
    return Response.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
});
