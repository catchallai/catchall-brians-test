import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

/**
 * Automation: When a CampaignBrief status changes to "active",
 * automatically create draft posts from its approved copy and templates.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { event, data } = await req.json();

    // Only trigger on status change to "active"
    if (event.type !== 'update' || data.status !== 'active') {
      return Response.json({ skipped: 'Not an activation event' });
    }

    const briefId = event.entity_id;
    const brief = data;

    // Validate brief has assets
    if (!brief.approved_copy_ids?.length || !brief.approved_template_ids?.length) {
      return Response.json({
        skipped: 'Brief has no approved copy or templates',
        briefId,
      });
    }

    // Fetch approved copy and templates
    const copyItems = await Promise.all(
      brief.approved_copy_ids.map((id) => base44.asServiceRole.entities.ApprovedCopy.filter({ id }))
    ).then((results) => results.flatMap((r) => r));

    const templates = await Promise.all(
      brief.approved_template_ids.map((id) =>
        base44.asServiceRole.entities.ApprovedGraphicTemplate.filter({ id })
      )
    ).then((results) => results.flatMap((r) => r));

    // Parse period (e.g., "2026-03") and get date range
    const [year, month] = (brief.month || '').split('-');
    if (!year || !month) {
      return Response.json({ error: 'Invalid brief month format' });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    // Get platform preferences from drivers
    const platforms = (brief.drivers || [])
      .filter(
        (d) =>
          d.channel &&
          ['Social', 'Email', 'Ads', 'Website', 'Newsletter', 'EDM'].includes(d.channel)
      )
      .map((d) => {
        const platformMap = {
          Social: ['Instagram', 'LinkedIn', 'Twitter'],
          Email: [],
          Ads: ['Instagram', 'Facebook'],
          Website: [],
          Newsletter: [],
          EDM: [],
        };
        return platformMap[d.channel] || [];
      })
      .flatMap((p) => p);

    const uniquePlatforms = [...new Set(platforms)].filter((p) => p);
    if (uniquePlatforms.length === 0) {
      return Response.json({ skipped: 'No platform drivers defined' });
    }

    // Create draft posts distributed throughout the month
    const createdPosts = [];
    let currentDate = new Date(startDate);
    let copyIdx = 0;
    let templateIdx = 0;

    while (currentDate <= endDate && createdPosts.length < 25) {
      for (const platform of uniquePlatforms) {
        if (createdPosts.length >= 25) break;

        const copy = copyItems[copyIdx % copyItems.length];
        const template = templates[templateIdx % templates.length];

        if (!copy || !template) continue;

        // Determine scheduled time (default to 10 AM)
        const scheduledTime = '10:00';

        // System-triggered path — there's no live user request. Honor an
        // explicit timezone on the brief if one was set; otherwise UTC. Marked
        // explicitly rather than relying on cron-side defaulting so the
        // assumption stays visible in this code path.
        // TODO: when CampaignBrief gains a creator-zone or brand-zone hint,
        //       prefer that over UTC here.
        const timezone = brief.timezone || 'UTC';

        try {
          const newPost = await base44.asServiceRole.entities.CalendarPost.create({
            title: copy.title,
            caption: copy.content,
            image_url: template.preview_url,
            image_urls: template.preview_url ? [template.preview_url] : [],
            video_url: null,
            media_type: 'image',
            scheduled_date: currentDate.toISOString().split('T')[0],
            scheduled_time: scheduledTime,
            timezone,
            platforms: [platform],
            hashtags: copy.tags || [],
            status: 'draft',
            brand_id: brief.brand_id,
            auto_post: false,
            campaign_brief_id: briefId,
            approved_copy_id: copy.id,
            approved_template_id: template.id,
            workflow_history: [
              {
                action: 'auto_created_on_brief_activation',
                by_email: 'system@automation',
                by_name: 'System Automation',
                timestamp: new Date().toISOString(),
                note: `Auto-generated when brief "${brief.title}" was activated`,
              },
            ],
          });

          createdPosts.push(newPost);
          copyIdx++;
          templateIdx++;
        } catch (err) {
          console.error('Failed to create post:', err.message);
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Track engagement metric
    await base44.asServiceRole.analytics.track({
      eventName: 'campaign_brief_auto_populated',
      properties: {
        briefId,
        postsCreated: createdPosts.length,
        platforms: uniquePlatforms,
      },
    });

    return Response.json({
      success: true,
      briefId,
      postsCreated: createdPosts.length,
      platforms: uniquePlatforms,
    });
  } catch (error) {
    console.error('Automation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
