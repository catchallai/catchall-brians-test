/**
 * Converts a given Date object to a local ISO string in the format 'YYYY-MM-DDTHH:mm'.
 * Adjusts for the user's timezone offset to ensure the result reflects local time
 * rather than UTC, which prevents off-by-one-day errors in negative-offset timezones.
 *
 * @param {Date} [d=new Date()] - The date to convert. Defaults to the current date and time.
 * @returns {string} The local ISO string representation, sliced to 'YYYY-MM-DDTHH:mm'.
 */
export const toLocalISOString = (d = new Date()) => {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16);
};

/**
 * Returns today's date as a 'YYYY-MM-DD' string in the user's local timezone.
 * Used as the minimum selectable date in date inputs to prevent past-date scheduling.
 *
 * @returns {string} Today's date in 'YYYY-MM-DD' format.
 */
export const todayLocal = () => toLocalISOString().split('T')[0];
