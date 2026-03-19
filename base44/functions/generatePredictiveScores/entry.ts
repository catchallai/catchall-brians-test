import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { visitor_session_id } = await req.json();

    // Get session data
    const sessions = await base44.asServiceRole.entities.VisitorSession.filter({
      id: visitor_session_id,
    });
    if (!sessions.length) return Response.json({ error: 'Session not found' }, { status: 404 });

    const session = sessions[0];

    // Get journey data
    const journeys = await base44.asServiceRole.entities.UserJourney.filter({ visitor_session_id });
    const journey = journeys[0];

    // Calculate engagement score
    const pageViews = journey?.pages_visited || 1;
    const timeOnSite = journey?.total_time || 0;
    const engagementScore = Math.min(100, pageViews * 10 + timeOnSite / 60);

    // Predict conversion probability using simple heuristics
    let conversionProbability = 0;
    const factors = [];

    if (timeOnSite > 300) {
      conversionProbability += 25;
      factors.push('High time on site');
    }
    if (pageViews >= 5) {
      conversionProbability += 20;
      factors.push('Multiple pages viewed');
    }
    if (session.referrer?.includes('google')) {
      conversionProbability += 15;
      factors.push('Organic search');
    }
    if (session.returning_visitor) {
      conversionProbability += 30;
      factors.push('Returning visitor');
    }

    conversionProbability = Math.min(95, conversionProbability);

    // Determine next best action
    let nextBestAction = 'Monitor engagement';
    if (conversionProbability > 70) {
      nextBestAction = 'Show special offer popup';
    } else if (conversionProbability > 40) {
      nextBestAction = 'Send targeted email campaign';
    } else if (timeOnSite < 60) {
      nextBestAction = 'Improve landing page content';
    }

    const predictiveScore = await base44.asServiceRole.entities.PredictiveScore.create({
      visitor_session_id,
      conversion_probability: Math.round(conversionProbability),
      churn_risk: Math.round(100 - conversionProbability),
      lifetime_value_estimate: Math.round(conversionProbability * 5),
      next_best_action: nextBestAction,
      engagement_score: Math.round(engagementScore),
      factors,
    });

    return Response.json({ success: true, data: predictiveScore });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
