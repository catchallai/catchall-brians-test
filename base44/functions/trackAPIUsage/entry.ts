import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Rate limiting configuration
const RATE_LIMITS = {
  InvokeLLM: { daily: 500, hourly: 50 },
  SendEmail: { daily: 200, hourly: 20 },
  GenerateImage: { daily: 100, hourly: 10 },
  UploadFile: { daily: 500, hourly: 100 },
};

const COST_PER_CALL = {
  InvokeLLM: 0.01,
  SendEmail: 0.001,
  GenerateImage: 0.05,
  UploadFile: 0.001,
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, endpoint } = await req.json();
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    if (action === 'check') {
      // Check if user can make the call
      const todayUsage = await base44.asServiceRole.entities.APIUsage.filter({
        date: today,
        endpoint,
      });

      const totalToday = todayUsage.reduce((sum, u) => sum + (u.calls_count || 0), 0);
      const limit = RATE_LIMITS[endpoint]?.daily || 1000;

      if (totalToday >= limit) {
        return Response.json({
          allowed: false,
          reason: 'Daily limit exceeded',
          usage: totalToday,
          limit,
        });
      }

      return Response.json({
        allowed: true,
        usage: totalToday,
        limit,
        remaining: limit - totalToday,
      });
    }

    if (action === 'track') {
      // Track the API call
      const existingUsage = await base44.asServiceRole.entities.APIUsage.filter({
        date: today,
        endpoint,
      });

      const cost = COST_PER_CALL[endpoint] || 0.001;

      if (existingUsage.length > 0) {
        await base44.asServiceRole.entities.APIUsage.update(existingUsage[0].id, {
          calls_count: (existingUsage[0].calls_count || 0) + 1,
          cost_estimate: (existingUsage[0].cost_estimate || 0) + cost,
        });
      } else {
        await base44.asServiceRole.entities.APIUsage.create({
          date: today,
          endpoint,
          calls_count: 1,
          cost_estimate: cost,
        });
      }

      return Response.json({ success: true, tracked: endpoint });
    }

    if (action === 'cleanup') {
      // Cleanup old data (older than 90 days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];

      // Get old usage records
      const oldUsage = await base44.asServiceRole.entities.APIUsage.list('date', 1000);
      let deleted = 0;

      for (const record of oldUsage) {
        if (record.date < cutoffStr) {
          await base44.asServiceRole.entities.APIUsage.delete(record.id);
          deleted++;
        }
      }

      return Response.json({ success: true, deleted });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
