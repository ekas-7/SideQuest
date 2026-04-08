export function getWeekStartISO(dateInput?: string) {
  const date = dateInput ? new Date(`${dateInput}T00:00:00.000Z`) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD");
  }

  const day = date.getUTCDay();
  const diff = day;
  const sunday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - diff));
  return sunday.toISOString().slice(0, 10);
}
