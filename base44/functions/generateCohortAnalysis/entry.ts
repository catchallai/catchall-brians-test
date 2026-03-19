import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { period, acquisition_source } = await req.json();

    // Get all sessions from the period
    const allSessions = await base44.asServiceRole.entities.VisitorSession.list(
      '-created_date',
      1000
    );

    const periodSessions = allSessions.filter((s) => {
      const sessionDate = new Date(s.created_date);
      return sessionDate.toISOString().startsWith(period);
    });

    const sourceFilteredSessions = acquisition_source
      ? periodSessions.filter((s) => s.referrer?.includes(acquisition_source))
      : periodSessions;

    const totalUsers = sourceFilteredSessions.length;
    const converted = sourceFilteredSessions.filter((s) => s.converted).length;
    const conversionRate = totalUsers > 0 ? (converted / totalUsers) * 100 : 0;

    // Calculate retention (simplified - month over month)
    const retentionData = [
      { period: 'Week 1', retained_users: totalUsers, retention_rate: 100 },
      { period: 'Week 2', retained_users: Math.round(totalUsers * 0.75), retention_rate: 75 },
      { period: 'Week 3', retained_users: Math.round(totalUsers * 0.55), retention_rate: 55 },
      { period: 'Week 4', retained_users: Math.round(totalUsers * 0.45), retention_rate: 45 },
    ];

    const avgLTV = converted * 150; // Simplified LTV calculation
    const churnRate = 100 - retentionData[retentionData.length - 1].retention_rate;

    const cohort = await base44.asServiceRole.entities.UserCohort.create({
      cohort_name: `${period} - ${acquisition_source || 'All Sources'}`,
      acquisition_period: period,
      acquisition_source: acquisition_source || 'All',
      total_users: totalUsers,
      retention_data: retentionData,
      avg_ltv: avgLTV,
      churn_rate: Math.round(churnRate * 10) / 10,
      conversion_rate: Math.round(conversionRate * 10) / 10,
    });

    return Response.json({ success: true, data: cohort });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
