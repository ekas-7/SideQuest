/**
 * Returns the ISO date string (YYYY-MM-DD) for the Monday of the given date's week.
 * If no date is provided, uses today.
 */
export function getWeekStart(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diff);
  return monday.toISOString().slice(0, 10);
}
