import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      copyId,
      templateId,
      scheduledDate,
      scheduledTime,
      scheduledAt: scheduledAtISO,
      timezone: timezoneFromRequest,
      platforms,
      campaignBriefId,
    } = await req.json();
    if (!copyId || !templateId || !scheduledDate) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Resolve the post's timezone: explicit request param wins, otherwise fall
    // back to the requesting user's stored zone, then UTC. Without this the
    // backend cron's wall-clock conversion would silently UTC-default the post,
    // publishing it at the wrong time for non-UTC users.
    const timezone = timezoneFromRequest || user.timezone || 'UTC';
    // Prefer an absolute ISO timestamp from the client (which carries the user's local timezone)
    // over constructing one server-side to avoid false rejections in non-UTC timezones.
    const scheduledAt = scheduledAtISO
      ? new Date(scheduledAtISO)
      : new Date(`${scheduledDate}T${scheduledTime || '10:00'}:00Z`);
    if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      return Response.json({ error: 'Scheduled time must be in the future' }, { status: 422 });
    }

    // Fetch approved copy and template
    const copies = await base44.entities.ApprovedCopy.filter({ id: copyId });
    const templates = await base44.entities.ApprovedGraphicTemplate.filter({ id: templateId });

    if (!copies?.length || !templates?.length) {
      return Response.json({ error: 'Copy or template not found' }, { status: 404 });
    }

    const copy = copies[0];
    const template = templates[0];

    // Fetch campaign brief if provided
    let _brief = null;
    if (campaignBriefId) {
      const briefs = await base44.entities.CampaignBrief.filter({ id: campaignBriefId });
      _brief = briefs[0] || null;
    }

    // Create draft post
    const newPost = await base44.entities.CalendarPost.create({
      title: copy.title,
      caption: copy.content,
      image_url: template.preview_url,
      image_urls: template.preview_url ? [template.preview_url] : [],
      video_url: null,
      media_type: 'image',
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime || '10:00',
      timezone,
      platforms: platforms || template.platforms || ['Instagram'],
      hashtags: copy.tags || [],
      status: 'draft',
      brand_id: copy.brand_id,
      auto_post: false,
      campaign_brief_id: campaignBriefId || null,
      approved_copy_id: copyId,
      approved_template_id: templateId,
      workflow_history: [
        {
          action: 'created_from_approved_assets',
          by_email: user.email,
          by_name: user.full_name,
          timestamp: new Date().toISOString(),
          note: `Created from approved copy "${copy.title}" and template "${template.title}"`,
        },
      ],
    });

    return Response.json({
      success: true,
      post: newPost,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
