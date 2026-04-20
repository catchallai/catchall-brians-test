import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Enforces the time-based status invariant for CalendarPosts:
// - Scheduled time in the past: "approved" → "published", other non-terminal → "unused"
// - Scheduled time in the future: "unused" → "draft" (an unused post cannot exist in the future)

const TERMINAL_STATUSES = ['published', 'rejected', 'deleted'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();

    const posts = await base44.asServiceRole.entities.CalendarPost.list('-scheduled_date', 500);

    const results = { published: 0, unused: 0, promoted: 0, errors: 0 };

    for (const post of posts) {
      if (TERMINAL_STATUSES.includes(post.status)) continue;
      if (!post.scheduled_date) continue;

      // Build UTC datetime from scheduled_date + scheduled_time (HH:MM)
      const time = post.scheduled_time || '00:00';
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledAt = new Date(
        `${post.scheduled_date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`
      );

      if (isNaN(scheduledAt.getTime())) {
        console.error(
          `Post ${post.id} has invalid scheduled time: ${post.scheduled_date} ${post.scheduled_time}`
        );
        results.errors++;
        continue;
      }

      let newStatus: string | null = null;

      if (scheduledAt <= now) {
        // Past: expire non-terminal posts (unused posts are already expired)
        if (post.status === 'unused') continue;
        newStatus = post.status === 'approved' ? 'published' : 'unused';
      } else {
        // Future: unused posts should be promoted back to draft
        if (post.status !== 'unused') continue;
        newStatus = 'draft';
      }

      try {
        await base44.asServiceRole.entities.CalendarPost.update(post.id, { status: newStatus });
        if (newStatus === 'published') results.published++;
        else if (newStatus === 'unused') results.unused++;
        else if (newStatus === 'draft') results.promoted++;
      } catch (err) {
        console.error(`Failed to update post ${post.id}:`, err.message);
        results.errors++;
      }
    }

    const processed = results.published + results.unused + results.promoted + results.errors;
    console.log(`Processed ${processed} posts:`, results);
    return Response.json({ processed, ...results });
  } catch (error) {
    console.error('updateExpiredPostStatuses error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
