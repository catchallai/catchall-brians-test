import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Updates CalendarPost statuses for posts whose scheduled time has passed:
// - "approved" posts → "published"
// - any other non-terminal status → "unused"

const TERMINAL_STATUSES = ['published', 'unused', 'rejected'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();

    // Fetch all posts that aren't already in a terminal state
    const posts = await base44.asServiceRole.entities.CalendarPost.list('-scheduled_date', 500);

    const expiredPosts = posts.filter((post) => {
      if (TERMINAL_STATUSES.includes(post.status)) return false;
      if (!post.scheduled_date) return false;

      // Build UTC datetime from scheduled_date + scheduled_time (HH:MM)
      const time = post.scheduled_time || '00:00';
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledAt = new Date(
        `${post.scheduled_date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`
      );

      return scheduledAt <= now;
    });

    const results = { published: 0, unused: 0, errors: 0 };

    for (const post of expiredPosts) {
      try {
        const newStatus = post.status === 'approved' ? 'published' : 'unused';
        await base44.asServiceRole.entities.CalendarPost.update(post.id, { status: newStatus });
        results[newStatus === 'published' ? 'published' : 'unused']++;
      } catch (err) {
        console.error(`Failed to update post ${post.id}:`, err.message);
        results.errors++;
      }
    }

    console.log(`Processed ${expiredPosts.length} expired posts:`, results);
    return Response.json({ processed: expiredPosts.length, ...results });
  } catch (error) {
    console.error('updateExpiredPostStatuses error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
