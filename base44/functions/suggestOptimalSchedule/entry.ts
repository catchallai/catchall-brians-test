import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { campaignBriefId, platforms } = await req.json();
    if (!campaignBriefId || !platforms?.length) {
      return Response.json({ error: 'Missing campaignBriefId or platforms' }, { status: 400 });
    }

    // Fetch campaign brief
    const brief = await base44.entities.CampaignBrief.filter({ id: campaignBriefId });
    if (!brief?.length) return Response.json({ error: 'Brief not found' }, { status: 404 });

    const campaignBrief = brief[0];

    // Fetch optimal posting times for selected platforms
    const optimalTimes = await base44.entities.OptimalPostingTime.filter({});
    const platformTimes = optimalTimes.filter((ot) => platforms.includes(ot.platform));

    // Fetch recent engagement data to inform suggestions
    const socialPosts = await base44.entities.SocialPost.list('-created_date', 50);
    const recentPerformance = socialPosts.slice(0, 20).map((p) => ({
      platform: p.platform,
      dayOfWeek: p.posted_at ? new Date(p.posted_at).getDay() : null,
      hour: p.posted_at ? new Date(p.posted_at).getHours() : null,
      likes: p.likes || 0,
      comments: p.comments || 0,
      shares: p.shares || 0,
      engagement: (p.likes || 0) + (p.comments || 0) * 2 + (p.shares || 0) * 3,
    }));

    // Use AI to generate scheduling suggestions
    const suggestions = await base44.integrations.Core.InvokeLLM({
      prompt: `
You are a social media scheduling expert. Analyze the following campaign brief and engagement data to suggest optimal posting schedule.

Campaign Brief:
- Title: ${campaignBrief.title}
- Focal Point: ${campaignBrief.focal_point}
- Objective: ${campaignBrief.objective}
- Period: ${campaignBrief.month}
- Platforms: ${platforms.join(', ')}

Historical Optimal Posting Times:
${platformTimes.map((pt) => `${pt.platform} - ${pt.day_of_week === 0 ? 'Sunday' : pt.day_of_week === 1 ? 'Monday' : pt.day_of_week === 2 ? 'Tuesday' : pt.day_of_week === 3 ? 'Wednesday' : pt.day_of_week === 4 ? 'Thursday' : pt.day_of_week === 5 ? 'Friday' : 'Saturday'} at ${pt.hour}:00 (Engagement Score: ${pt.engagement_score.toFixed(1)})`).join('\n')}

Recent Performance Data (Top Posts):
${recentPerformance
  .slice(0, 10)
  .map(
    (rp) =>
      `${rp.platform} - ${rp.dayOfWeek ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][rp.dayOfWeek] : 'Unknown'} ${rp.hour || 'Unknown'}:00 - Engagement: ${rp.engagement}`
  )
  .join('\n')}

Based on this data, provide a JSON response with:
{
  "schedule": [
    {
      "platform": "platform_name",
      "daysOfWeek": [0-6, ...],
      "preferredHours": [0-23, ...],
      "rationale": "explanation",
      "frequency": "number of times per week",
      "contentTypePreference": "text/image/video/carousel"
    }
  ],
  "strategyNotes": "overall scheduling strategy",
  "expectedImpact": "potential reach and engagement estimate"
}

Return ONLY valid JSON.
      `,
      response_json_schema: {
        type: 'object',
        properties: {
          schedule: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                platform: { type: 'string' },
                daysOfWeek: { type: 'array', items: { type: 'number' } },
                preferredHours: { type: 'array', items: { type: 'number' } },
                rationale: { type: 'string' },
                frequency: { type: 'number' },
                contentTypePreference: { type: 'string' },
              },
            },
          },
          strategyNotes: { type: 'string' },
          expectedImpact: { type: 'string' },
        },
      },
    });

    return Response.json({ suggestions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
