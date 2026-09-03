import { describe, it, expect } from "vitest";
import { average, currentStreakDays, scoreDelta } from "./compute";

describe("average", () => {
  it("returns null for an empty array", () => {
    expect(average([])).toBeNull();
  });

  it("averages values", () => {
    expect(average([10, 20, 30])).toBe(20);
  });
});

describe("currentStreakDays", () => {
  const now = new Date("2026-09-03T18:00:00");

  it("is zero with no sessions", () => {
    expect(currentStreakDays([], now)).toBe(0);
  });

  it("counts a session earlier today as a streak of 1", () => {
    expect(currentStreakDays(["2026-09-03T09:00:00"], now)).toBe(1);
  });

  it("still counts yesterday's session even if nothing happened yet today", () => {
    expect(currentStreakDays(["2026-09-02T09:00:00"], now)).toBe(1);
  });

  it("counts consecutive days", () => {
    const dates = [
      "2026-09-01T09:00:00",
      "2026-09-02T09:00:00",
      "2026-09-03T09:00:00",
    ];
    expect(currentStreakDays(dates, now)).toBe(3);
  });

  it("breaks the streak on a gap day", () => {
    const dates = ["2026-08-30T09:00:00", "2026-09-03T09:00:00"];
    expect(currentStreakDays(dates, now)).toBe(1);
  });
});

describe("scoreDelta", () => {
  it("returns null with fewer than 4 sessions", () => {
    expect(scoreDelta([50, 60, 70])).toBeNull();
  });

  it("compares the earlier half average to the recent half average", () => {
    const result = scoreDelta([50, 50, 80, 80]);
    expect(result).not.toBeNull();
    expect(result!.earlierAvg).toBe(50);
    expect(result!.recentAvg).toBe(80);
    expect(result!.deltaPct).toBeCloseTo(60, 5);
  });

  it("handles a zero earlier average without dividing by zero", () => {
    const result = scoreDelta([0, 0, 10, 10]);
    expect(result!.deltaPct).toBe(0);
  });
});
