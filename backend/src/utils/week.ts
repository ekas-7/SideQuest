const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const toDateOnly = (value: Date): string => value.toISOString().slice(0, 10);

export const getWeekStartSunday = (input: Date = new Date()): string => {
  const utc = new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  const day = utc.getUTCDay();
  utc.setTime(utc.getTime() - day * DAY_IN_MS);
  return toDateOnly(utc);
};

export const getWeekEndSaturday = (weekStart: string): string => {
  const start = new Date(`${weekStart}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 6 * DAY_IN_MS);
  return toDateOnly(end);
};

export const isWithinWeek = (dateToCheck: Date, weekStart: string): boolean => {
  const start = new Date(`${weekStart}T00:00:00.000Z`).getTime();
  const end = new Date(`${getWeekEndSaturday(weekStart)}T23:59:59.999Z`).getTime();
  const current = dateToCheck.getTime();
  return current >= start && current <= end;
};
