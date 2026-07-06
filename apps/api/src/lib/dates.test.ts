import { describe, expect, it } from "vitest";
import { addDays, dayInTimeZone } from "./dates.js";

describe("dayInTimeZone", () => {
  // 2026-07-05T20:00:00Z = 2026-07-06 01:30 IST — the 23:50-IST-style boundary case
  const lateUtc = new Date("2026-07-05T20:00:00.000Z");

  it("crosses the day boundary in the user's timezone, not UTC", () => {
    expect(dayInTimeZone(lateUtc, "Asia/Kolkata")).toBe("2026-07-06");
    expect(dayInTimeZone(lateUtc, "UTC")).toBe("2026-07-05");
    expect(dayInTimeZone(lateUtc, "America/Los_Angeles")).toBe("2026-07-05");
  });

  it("falls back to UTC on a corrupt timezone", () => {
    expect(dayInTimeZone(lateUtc, "Not/AZone")).toBe("2026-07-05");
  });
});

describe("addDays", () => {
  it("handles month and year rollovers", () => {
    expect(addDays("2026-07-06", -1)).toBe("2026-07-05");
    expect(addDays("2026-08-01", -1)).toBe("2026-07-31");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01"); // not a leap year
  });
});
