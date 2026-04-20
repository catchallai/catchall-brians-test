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
 * Returns true when a scheduled date+time is strictly in the future.
 * Uses minute-level precision to match the server-side expiration logic.
 * Missing `scheduledTime` is treated as '00:00' (same as the backend).
 */
export const isScheduledInFuture = (
  scheduledDate: string,
  scheduledTime?: string | null
): boolean => {
  const time = scheduledTime || '00:00';
  const scheduled = new Date(`${scheduledDate}T${time}`);
  return scheduled > new Date();
};
