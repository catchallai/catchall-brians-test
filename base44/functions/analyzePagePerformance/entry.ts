import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { page_url } = await req.json();

    // Simulate performance metrics (in production, this would come from Real User Monitoring)
    const metrics = {
      lcp: 1200 + Math.random() * 1000,
      fid: 50 + Math.random() * 100,
      cls: Math.random() * 0.2,
      ttfb: 200 + Math.random() * 300,
      load_time: 2000 + Math.random() * 2000,
    };

    // Calculate performance score
    const lcpScore = metrics.lcp < 2500 ? 100 : metrics.lcp < 4000 ? 50 : 0;
    const fidScore = metrics.fid < 100 ? 100 : metrics.fid < 300 ? 50 : 0;
    const clsScore = metrics.cls < 0.1 ? 100 : metrics.cls < 0.25 ? 50 : 0;
    const performanceScore = (lcpScore + fidScore + clsScore) / 3;

    const performance = await base44.asServiceRole.entities.PagePerformance.create({
      page_url,
      lcp: Math.round(metrics.lcp),
      fid: Math.round(metrics.fid),
      cls: Math.round(metrics.cls * 100) / 100,
      ttfb: Math.round(metrics.ttfb),
      load_time: Math.round(metrics.load_time),
      performance_score: Math.round(performanceScore),
      device_type: 'desktop',
    });

    return Response.json({ success: true, data: performance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
