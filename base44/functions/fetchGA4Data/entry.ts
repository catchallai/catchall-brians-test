import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = Deno.env.get('GA4_MEASUREMENT_ID');

    if (!propertyId) {
      return Response.json({ error: 'GA4 credentials not configured' }, { status: 500 });
    }

    // Fetch data from GA4 Data API
    const today = new Date().toISOString().split('T')[0];
    const daysAgo90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const reportRequest = {
      dateRanges: [{ startDate: daysAgo90, endDate: today }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
        { name: 'city' },
        { name: 'country' },
        { name: 'deviceCategory' },
        { name: 'browser' },
        { name: 'date' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'engagementRate' },
      ],
      limit: 1000,
    };

    // Call GA4 Data API
    const gaResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}/reports:runReport`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('GA4_API_SECRET')}`,
        },
        body: JSON.stringify(reportRequest),
      }
    );

    if (!gaResponse.ok) {
      const error = await gaResponse.text();
      console.error('GA4 API Error:', error);
      return Response.json(
        {
          error: 'Failed to fetch GA4 data',
          details: error,
        },
        { status: 500 }
      );
    }

    const gaData = await gaResponse.json();

    // Transform GA4 data into visitor profiles
    const visitors = [];
    const rows = gaData.rows || [];

    for (let i = 0; i < Math.min(rows.length, 100); i++) {
      const row = rows[i];
      const dims = row.dimensionValues || [];
      const metrics = row.metricValues || [];

      const source = dims[0]?.value || 'direct';
      const medium = dims[1]?.value || 'none';
      const city = dims[2]?.value || 'Unknown';
      const country = dims[3]?.value || 'Unknown';
      const device = dims[4]?.value || 'desktop';
      const browser = dims[5]?.value || 'Unknown';
      const date = dims[6]?.value || '';

      const sessions = parseInt(metrics[0]?.value || '1');
      const pageViews = parseInt(metrics[1]?.value || '1');
      const avgDuration = parseFloat(metrics[2]?.value || '0');
      const engagementRate = parseFloat(metrics[3]?.value || '0');

      // Calculate days ago
      const visitDate = new Date(
        date.substring(0, 4) + '-' + date.substring(4, 6) + '-' + date.substring(6, 8)
      );
      const daysAgo = Math.floor((Date.now() - visitDate.getTime()) / (1000 * 60 * 60 * 24));

      visitors.push({
        id: i + 1,
        sessionId: `GA-${date}-${i}`,
        company: `${city} Visitor`,
        industry: 'Technology',
        city,
        country,
        pagesViewed: pageViews,
        timeOnSite: `${Math.floor(avgDuration / 60)}m ${Math.floor(avgDuration % 60)}s`,
        lastPage: '/',
        firstVisit: sessions === 1,
        visitCount: sessions,
        device: device.charAt(0).toUpperCase() + device.slice(1),
        browser,
        referrer: source,
        entryPage: '/',
        daysAgo,
        lastSeen: visitDate.toISOString(),
        engagementRate: Math.round(engagementRate * 100),
      });
    }

    return Response.json({
      visitors,
      totalVisitors: visitors.length,
      dataSource: 'google_analytics',
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
});
