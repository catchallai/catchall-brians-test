/**
 * Helper to compare currentMonth to today.
 * Returns { isSameMonth, isFutureMonth, isPastMonth }
 */
export function getMonthComparison(today: Date, currentMonth?: Date | null) {
  if (!(currentMonth instanceof Date)) {
    return { isSameMonth: false, isFutureMonth: false, isPastMonth: false };
  }
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth();
  const monthYear = currentMonth.getFullYear();
  const monthMonth = currentMonth.getMonth();
  const isSameMonth = thisYear === monthYear && thisMonth === monthMonth;
  const isFutureMonth = monthYear > thisYear || (monthYear === thisYear && monthMonth > thisMonth);
  const isPastMonth = monthYear < thisYear || (monthYear === thisYear && monthMonth < thisMonth);
  return { isSameMonth, isFutureMonth, isPastMonth };
}
