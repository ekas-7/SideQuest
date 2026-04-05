import { describe, expect, test } from "bun:test";

import { getWeekEndSaturday, isWithinWeek } from "./week.ts";

describe("week utils", () => {
  test("valid weekStart (YYYY-MM-DD) works", () => {
    expect(isWithinWeek(new Date("2026-04-05T00:00:00.000Z"), "2026-04-05")).toBe(true);
    expect(isWithinWeek(new Date("2026-04-11T23:59:59.999Z"), "2026-04-05")).toBe(true);
    expect(isWithinWeek(new Date("2026-04-12T00:00:00.000Z"), "2026-04-05")).toBe(false);
  });

  test("ISO datetime week input is normalized and works", () => {
    const isoWeekStart = "2026-04-05T08:11:00.000Z";
    expect(getWeekEndSaturday(isoWeekStart)).toBe("2026-04-11");
    expect(isWithinWeek(new Date("2026-04-09T12:00:00.000Z"), isoWeekStart)).toBe(true);
  });

  test("invalid weekStart does not throw and returns false", () => {
    expect(() => isWithinWeek(new Date("2026-04-09T12:00:00.000Z"), "not-a-date")).not.toThrow();
    expect(isWithinWeek(new Date("2026-04-09T12:00:00.000Z"), "not-a-date")).toBe(false);
  });
});
