import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { website_url, start_date, end_date } = await req.json();

    // Get Google Search Console access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesearchconsole');

    // Fetch Search Analytics data
    const searchAnalyticsResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(website_url)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: start_date,
          endDate: end_date,
          dimensions: ['query', 'page', 'date'],
          rowLimit: 1000,
        }),
      }
    );

    if (!searchAnalyticsResponse.ok) {
      const error = await searchAnalyticsResponse.text();
      return Response.json(
        { error: `GSC API error: ${error}` },
        { status: searchAnalyticsResponse.status }
      );
    }

    const data = await searchAnalyticsResponse.json();

    // Transform data
    const keywords = {};
    const dailyMetrics = {};

    (data.rows || []).forEach((row) => {
      const query = row.keys[0];
      const page = row.keys[1];
      const date = row.keys[2];

      // Aggregate by keyword
      if (!keywords[query]) {
        keywords[query] = {
          keyword: query,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
          pages: new Set(),
        };
      }

      keywords[query].clicks += row.clicks;
      keywords[query].impressions += row.impressions;
      keywords[query].ctr = keywords[query].clicks / keywords[query].impressions;
      keywords[query].position = (keywords[query].position + row.position) / 2;
      keywords[query].pages.add(page);

      // Daily metrics for trends
      if (!dailyMetrics[date]) {
        dailyMetrics[date] = { date, clicks: 0, impressions: 0, ctr: 0, position: 0 };
      }
      dailyMetrics[date].clicks += row.clicks;
      dailyMetrics[date].impressions += row.impressions;
    });

    // Calculate average CTR and position for daily metrics
    Object.values(dailyMetrics).forEach((day) => {
      day.ctr = day.clicks / day.impressions;
      const dayRows = data.rows.filter((r) => r.keys[2] === day.date);
      day.position = dayRows.reduce((sum, r) => sum + r.position, 0) / dayRows.length;
    });

    return Response.json({
      keywords: Object.values(keywords).map((k) => ({
        ...k,
        pages: Array.from(k.pages),
      })),
      daily_metrics: Object.values(dailyMetrics).sort((a, b) => a.date.localeCompare(b.date)),
      total_clicks: data.rows.reduce((sum, r) => sum + r.clicks, 0),
      total_impressions: data.rows.reduce((sum, r) => sum + r.impressions, 0),
      avg_position: data.rows.reduce((sum, r) => sum + r.position, 0) / (data.rows.length || 1),
    });
  } catch (error) {
    console.error('GSC fetch error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
