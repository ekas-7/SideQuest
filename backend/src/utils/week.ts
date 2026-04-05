const DAY_IN_MS = 24 * 60 * 60 * 1000;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidDate = (value: Date): boolean => !Number.isNaN(value.getTime());

const toUtcMidnight = (value: Date): Date =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));

const normalizeDateOnlyString = (value: string): string | null => {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!isValidDate(parsed)) {
    return null;
  }

  const normalized = parsed.toISOString().slice(0, 10);
  return normalized === value ? normalized : null;
};

const toUtcDateOnly = (value: Date | string): Date | null => {
  if (value instanceof Date) {
    if (!isValidDate(value)) {
      return null;
    }
    return toUtcMidnight(value);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const directDateOnly = normalizeDateOnlyString(trimmed);
  if (directDateOnly) {
    return new Date(`${directDateOnly}T00:00:00.000Z`);
  }

  const parsed = new Date(trimmed);
  if (!isValidDate(parsed)) {
    return null;
  }

  return toUtcMidnight(parsed);
};

export const toDateOnly = (value: Date | string): string | null => {
  const normalized = toUtcDateOnly(value);
  return normalized ? normalized.toISOString().slice(0, 10) : null;
};

export const getWeekStartSunday = (input: Date = new Date()): string => {
  const utc = toUtcDateOnly(input) ?? toUtcMidnight(new Date());
  const day = utc.getUTCDay();
  utc.setTime(utc.getTime() - day * DAY_IN_MS);
  return toDateOnly(utc) ?? "";
};

export const getWeekEndSaturday = (weekStart: string): string => {
  const start = toUtcDateOnly(weekStart);
  if (!start) {
    return "";
  }

  const end = new Date(start.getTime() + 6 * DAY_IN_MS);
  return toDateOnly(end) ?? "";
};

export const isWithinWeek = (dateToCheck: Date, weekStart: string): boolean => {
  const normalizedCurrent = toUtcDateOnly(dateToCheck);
  const normalizedStart = toUtcDateOnly(weekStart);

  if (!normalizedCurrent || !normalizedStart) {
    return false;
  }

  const start = normalizedStart.getTime();
  const end = start + 6 * DAY_IN_MS;
  const current = normalizedCurrent.getTime();
  return current >= start && current <= end;
};
