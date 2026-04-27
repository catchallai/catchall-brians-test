import { TIMEZONE_REGIONS } from '@/types/enums';

/**
 * Converts a given Date object to a local ISO string in the format 'YYYY-MM-DDTHH:mm'.
 * Adjusts for the user's timezone offset to ensure the result reflects local time
 * rather than UTC, which prevents off-by-one-day errors in negative-offset timezones.
 */
export const toLocalISOString = (d: Date = new Date()): string => {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
};

/**
 * Returns today's date as a 'YYYY-MM-DD' string in the user's local timezone.
 * Used as the minimum selectable date in date inputs to prevent past-date scheduling.
 */
export const todayLocal = (): string => toLocalISOString().split('T')[0];

/**
 * Converts a wall-clock date+time interpreted in the named IANA zone to its
 * absolute UTC Date. Mirrors the backend cron's conversion in
 * `base44/functions/{checkScheduledPosts,updateExpiredPostStatuses}/entry.ts`
 * so the frontend's "is this in the future?" judgement matches what the
 * server will eventually publish on.
 *
 * Two-pass to handle DST edges: the offset at the naive UTC interpretation
 * may differ from the offset at the actual instant, so we re-evaluate.
 *
 * Falls back to UTC for empty or invalid zones — same as the backend cron.
 * Earlier versions fell back to browser-local, which produced a frontend ↔
 * cron disagreement for legacy posts (no `timezone` field) and re-introduced
 * the UNUSED↔DRAFT flap CS-2274 was meant to prevent.
 */
export const wallClockToUtc = (date: string, time: string, timeZone?: string | null): Date => {
  const t = time || '00:00';
  let zone = timeZone || 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
  } catch {
    zone = 'UTC';
  }

  const [hh, mm] = t.split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(hh) || Number.isNaN(mm)) return new Date(NaN);
  const naive = new Date(
    `${date}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00Z`
  );
  if (Number.isNaN(naive.getTime())) return naive;
  if (zone === 'UTC') return naive;

  // `timeZoneName: 'longOffset'` is ES2024 — older runtimes throw RangeError.
  // Wrap so callers always get a Date back; on failure we fall through to the
  // naive UTC interpretation (better than blowing up the scheduling UI).
  const offsetMs = (instant: Date): number => {
    try {
      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' });
      const offsetStr =
        fmt.formatToParts(instant).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
      if (offsetStr === 'GMT') return 0;
      const match = offsetStr.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
      if (!match) return 0;
      const sign = match[1] === '-' ? -1 : 1;
      const hours = parseInt(match[2], 10);
      const mins = parseInt(match[3] ?? '0', 10);
      return sign * (hours * 60 + mins) * 60 * 1000;
    } catch {
      return 0;
    }
  };

  const firstGuess = new Date(naive.getTime() - offsetMs(naive));
  return new Date(naive.getTime() - offsetMs(firstGuess));
};

/**
 * Returns true when a scheduled date+time is strictly in the future.
 * Uses minute-level precision to match the server-side expiration logic.
 * Missing `scheduledTime` is treated as '00:00' (same as the backend).
 *
 * When `timeZone` is provided, the wall-clock is interpreted in that IANA
 * zone. When omitted (e.g. legacy posts without a `timezone` field), it
 * falls back to UTC — matching the backend cron, so the frontend's
 * judgement always agrees with what the server will eventually do.
 */
export const isScheduledInFuture = (
  scheduledDate: string,
  scheduledTime?: string | null,
  timeZone?: string | null
): boolean => {
  const scheduled = wallClockToUtc(scheduledDate, scheduledTime || '00:00', timeZone);
  return scheduled > new Date();
};

/**
 * Returns a short UTC-offset label ("UTC", "UTC-5", "UTC+5:30") for `timeZone`
 * at the given reference instant. The reference matters because zones with
 * DST shift offset across the year, so the label should reflect what the
 * caller will actually publish at — not what offset is in effect right now.
 *
 * Falls back to "UTC" if the runtime can't format the zone (older browsers
 * lacking ES2024 `'longOffset'`, or invalid IANA names).
 */
export const getUtcOffsetLabel = (timeZone: string, referenceDate: Date): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    const offset =
      formatter.formatToParts(referenceDate).find((p) => p.type === 'timeZoneName')?.value ?? '';
    if (!offset || offset === 'GMT' || offset === 'GMT+00:00') return 'UTC';
    const match = offset.match(/^GMT([+-])(\d{1,2}):(\d{2})$/);
    if (!match) return offset.replace('GMT', 'UTC');
    const [, sign, hh, mm] = match;
    const hours = parseInt(hh, 10);
    return mm === '00' ? `UTC${sign}${hours}` : `UTC${sign}${hours}:${mm}`;
  } catch {
    return 'UTC';
  }
};

/**
 * Resolves any IANA timezone value to its curated `TIMEZONE_REGIONS` entry's
 * canonical IANA, walking aliases (e.g. `America/Vancouver` → `America/Los_Angeles`).
 * Returns null when the value isn't a known region or alias — callers should
 * either render the raw IANA or fall back to a sensible default in that case.
 */
export const resolveRegionIana = (value: string): string | null => {
  if (!value) return null;
  const direct = TIMEZONE_REGIONS.find((r) => r.iana === value);
  if (direct) return direct.iana;
  const aliased = TIMEZONE_REGIONS.find((r) => r.aliases?.includes(value));
  return aliased ? aliased.iana : null;
};
