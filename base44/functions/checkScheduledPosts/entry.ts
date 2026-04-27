import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Cron-invoked: publishes scheduled posts whose absolute UTC instant
// (scheduled_date + scheduled_time interpreted in `timezone`, falling back to UTC)
// is at or before `now`. Posts without a `timezone` field are interpreted as UTC,
// preserving previous behaviour for unmigrated rows.

// SHARED-BEGIN: wallClockToUtc
// Duplicated verbatim in:
//   base44/functions/checkScheduledPosts/entry.ts
//   base44/functions/updateExpiredPostStatuses/entry.ts
// Base44's deployer doesn't bundle relative imports across functions, so a
// shared module isn't viable today. Keep the block between SHARED-BEGIN and
// SHARED-END byte-identical in both files. `npm run check:cron-sync` enforces it.
/**
 * Converts a wall-clock date+time in a named IANA zone to its absolute UTC Date.
 * Two-pass to handle DST edges (offset at the naive UTC interpretation may differ
 * from the offset at the actual instant).
 */
function wallClockToUtc(date: string, time: string, timeZone: string): Date {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return new Date(NaN);
  const naive = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`);
  if (Number.isNaN(naive.getTime())) return naive;

  let zone = timeZone || 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
  } catch {
    zone = 'UTC';
  }
  if (zone === 'UTC') return naive;

  // `timeZoneName: 'longOffset'` is ES2024 — older runtimes throw RangeError.
  // Wrap so callers always get a Date back; on failure we fall through to the
  // naive UTC interpretation (better than blowing up the cron run).
  const offsetMs = (instant: Date): number => {
    try {
      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' });
      const offsetStr =
        fmt.formatToParts(instant).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
      if (offsetStr === 'GMT') return 0;
      const match = offsetStr.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
      if (!match) return 0;
      const sign = match[1] === '-' ? -1 : 1;
      const hh = parseInt(match[2], 10);
      const mm = parseInt(match[3] ?? '0', 10);
      return sign * (hh * 60 + mm) * 60 * 1000;
    } catch {
      return 0;
    }
  };

  const firstGuess = new Date(naive.getTime() - offsetMs(naive));
  return new Date(naive.getTime() - offsetMs(firstGuess));
}
// SHARED-END: wallClockToUtc

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();

    const allPosts = await base44.asServiceRole.entities.CalendarPost.filter({
      status: 'scheduled',
      auto_post: true,
    });

    const duePosts = allPosts.filter((post) => {
      if (!post.scheduled_date) return false;
      const scheduledAt = wallClockToUtc(
        post.scheduled_date,
        post.scheduled_time || '00:00',
        post.timezone || 'UTC'
      );
      if (Number.isNaN(scheduledAt.getTime())) return false;
      return scheduledAt <= now;
    });

    console.log(`Found ${duePosts.length} posts ready to publish`);

    const results = [];
    for (const post of duePosts) {
      try {
        // Call the auto-post function
        const response = await base44.asServiceRole.functions.invoke('autoPostToSocial', {
          postId: post.id,
        });

        results.push({
          postId: post.id,
          success: response.data.success,
          results: response.data.results,
        });
      } catch (error) {
        results.push({
          postId: post.id,
          success: false,
          error: error.message,
        });
      }
    }

    return Response.json({
      checked: allPosts.length,
      published: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error('Check scheduled posts error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
