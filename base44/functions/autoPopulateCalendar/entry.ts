import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      campaignBriefId,
      platforms,
      postCount = 20,
      timezone: timezoneFromRequest,
    } = await req.json();
    if (!campaignBriefId || !platforms?.length) {
      return Response.json({ error: 'Missing campaignBriefId or platforms' }, { status: 400 });
    }
    // Resolve the post's timezone: explicit request param wins, otherwise fall
    // back to the requesting user's stored zone, then UTC. Without this the
    // backend cron's wall-clock conversion would silently UTC-default the post,
    // publishing it at the wrong time for non-UTC users.
    const timezone = timezoneFromRequest || user.timezone || 'UTC';

    // Fetch campaign brief
    const briefs = await base44.entities.CampaignBrief.filter({ id: campaignBriefId });
    if (!briefs?.length) return Response.json({ error: 'Brief not found' }, { status: 404 });

    const brief = briefs[0];
    const copyIds = brief.approved_copy_ids || [];
    const templateIds = brief.approved_template_ids || [];

    if (copyIds.length === 0 || templateIds.length === 0) {
      return Response.json(
        { error: 'Campaign brief has no approved copy or templates linked' },
        { status: 400 }
      );
    }

    // Fetch approved copy and templates
    const copyItems = await Promise.all(
      copyIds.map((id) => base44.entities.ApprovedCopy.filter({ id }))
    ).then((results) => results.flatMap((r) => r));

    const templates = await Promise.all(
      templateIds.map((id) => base44.entities.ApprovedGraphicTemplate.filter({ id }))
    ).then((results) => results.flatMap((r) => r));

    // Get optimal times for scheduling
    const optimalTimes = await base44.entities.OptimalPostingTime.list();
    const platformTimes = optimalTimes.filter((ot) => platforms.includes(ot.platform));

    // Generate draft posts
    const createdPosts = [];
    const period = brief.month; // e.g., "2026-03"
    const [year, month] = period.split('-');
    const startDate = new Date(year, parseInt(month) - 1, 1);
    const endDate = new Date(year, parseInt(month), 0);

    // Distribute posts throughout the month
    let currentDate = new Date(startDate);
    let postIndex = 0;

    while (currentDate <= endDate && createdPosts.length < postCount) {
      for (const platform of platforms) {
        if (createdPosts.length >= postCount) break;

        // Get optimal times for this platform
        const platformOptimal = platformTimes.filter((pt) => pt.platform === platform);
        let selectedTime = platformOptimal[0];

        if (!selectedTime) {
          selectedTime = { platform, hour: 10, day_of_week: currentDate.getDay() };
        }

        // Cycle through copy and templates
        const copy = copyItems[postIndex % copyItems.length];
        const template = templates[postIndex % templates.length];

        if (!copy || !template) continue;

        const scheduledDate = new Date(currentDate);
        scheduledDate.setHours(selectedTime.hour || 10, 0, 0, 0);

        // Create draft post
        const newPost = await base44.entities.CalendarPost.create({
          title: copy.title,
          caption: copy.content,
          image_url: template.preview_url,
          image_urls: template.preview_url ? [template.preview_url] : [],
          video_url: null,
          media_type: 'image',
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          scheduled_time: `${String(selectedTime.hour || 10).padStart(2, '0')}:00`,
          timezone,
          platforms: [platform],
          hashtags: copy.tags || [],
          status: 'draft',
          brand_id: brief.brand_id,
          auto_post: true,
          campaign_brief_id: campaignBriefId,
          approved_copy_id: copy.id,
          approved_template_id: template.id,
          workflow_history: [
            {
              action: 'auto_created_from_brief',
              by_email: user.email,
              by_name: user.full_name,
              timestamp: new Date().toISOString(),
              note: `Auto-generated from campaign brief: ${brief.title}`,
            },
          ],
        });

        createdPosts.push(newPost);
        postIndex++;
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return Response.json({
      success: true,
      postsCreated: createdPosts.length,
      posts: createdPosts.map((p) => ({
        id: p.id,
        title: p.title,
        platform: p.platforms[0],
        scheduledDate: p.scheduled_date,
        status: p.status,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
