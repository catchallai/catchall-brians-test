import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Enforces the time-based status invariant for CalendarPosts:
// - Scheduled time in the past: "approved" → "published", other non-terminal → "unused"
// - Scheduled time in the future: "unused" → "draft" (an unused post cannot exist in the future)
//
// Posts carry a `timezone` (IANA name) representing the zone their scheduled_date +
// scheduled_time wall-clock should be interpreted in. We convert that wall-clock to
// an absolute UTC instant before comparing with `now`. Posts without `timezone` fall
// back to UTC (matching the previous behaviour, so unmigrated rows are unaffected).

const TERMINAL_STATUSES = ['published', 'rejected', 'deleted'];

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

    const posts = await base44.asServiceRole.entities.CalendarPost.list('-scheduled_date', 500);

    const results = { published: 0, unused: 0, promoted: 0, errors: 0 };

    for (const post of posts) {
      if (TERMINAL_STATUSES.includes(post.status)) continue;
      if (!post.scheduled_date) continue;

      const time = post.scheduled_time || '00:00';
      const tz = post.timezone || 'UTC';
      const scheduledAt = wallClockToUtc(post.scheduled_date, time, tz);

      if (Number.isNaN(scheduledAt.getTime())) {
        console.error(
          `Post ${post.id} has invalid scheduled time: ${post.scheduled_date} ${post.scheduled_time} ${tz}`
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
