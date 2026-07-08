import { describe, expect, it } from "vitest";
import { SRS_DEFAULT, nextReviewDate, srsAfterSubmission } from "./srs.js";
import { categoryFluency, displayedFluency, readinessFor } from "./scoring.js";

describe("srsAfterSubmission (SM-2 lite, §9)", () => {
  it("walks the pass ladder 1 → 3 → 7 → 14", () => {
    let state = { ...SRS_DEFAULT };
    const intervals: number[] = [];
    for (let i = 0; i < 4; i++) {
      state = srsAfterSubmission(state, { passed: true, score: 80 });
      intervals.push(state.intervalDays);
    }
    expect(intervals).toEqual([1, 3, 7, 14]);
    expect(state.ease).toBe(2.5); // 80 < 90 → ease untouched
  });

  it("beyond the ladder multiplies by ease", () => {
    const state = srsAfterSubmission({ intervalDays: 14, ease: 2.5 }, { passed: true, score: 80 });
    expect(state.intervalDays).toBe(35); // round(14 × 2.5)
  });

  it("a ≥90 rep nudges ease up, capped at 2.8", () => {
    expect(srsAfterSubmission({ intervalDays: 1, ease: 2.5 }, { passed: true, score: 92 }).ease).toBe(2.55);
    expect(srsAfterSubmission({ intervalDays: 1, ease: 2.8 }, { passed: true, score: 100 }).ease).toBe(2.8);
  });

  it("a fail resets the interval and dents ease, floored at 1.3", () => {
    const failed = srsAfterSubmission({ intervalDays: 14, ease: 1.4 }, { passed: false, score: 20 });
    expect(failed.intervalDays).toBe(1);
    expect(failed.ease).toBe(1.3); // 1.4 − 0.2 floored
  });

  it("nextReviewDate lands intervalDays out", () => {
    const from = new Date("2026-07-07T12:00:00Z");
    expect(nextReviewDate(from, 3).toISOString()).toBe("2026-07-10T12:00:00.000Z");
  });
});

describe("displayedFluency decay (§9)", () => {
  it("no decay inside the 7-day grace window", () => {
    expect(displayedFluency(84, 0)).toBe(84);
    expect(displayedFluency(84, 7)).toBe(84);
  });

  it("1.5%/day after the grace window", () => {
    expect(displayedFluency(80, 9)).toBe(80 * (1 - 0.03)); // 2 days past grace
    expect(displayedFluency(100, 17)).toBe(85); // 10 days past grace
  });

  it("floors at 60% of the EMA", () => {
    expect(displayedFluency(90, 400)).toBe(54);
  });
});

describe("categoryFluency (§9)", () => {
  it("hidden until 5 passed challenges", () => {
    expect(categoryFluency([90, 90, 90, 90], 4)).toBeNull();
  });
  it("mean of the top 10 displayed scores", () => {
    const scores = [100, 90, 80, 70, 60];
    expect(categoryFluency(scores, 5)).toBe(80);
    const twelve = [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 10, 10];
    expect(categoryFluency(twelve, 12)).toBe(100); // bottom two fall outside top-10
  });
});

describe("readinessFor (§9 thresholds)", () => {
  const ready = { categoryScore: 85, passedCount: 12, passedAtD4Plus: 3, daysSinceLastTrained: 2 };
  it("ready needs score ≥80, ≥8 passed, ≥2 at D4+, trained ≤14d", () => {
    expect(readinessFor(ready)).toBe("ready");
    expect(readinessFor({ ...ready, categoryScore: 79 })).toBe("needs-work");
    expect(readinessFor({ ...ready, passedCount: 7 })).toBe("needs-work");
    expect(readinessFor({ ...ready, passedAtD4Plus: 1 })).toBe("needs-work");
    expect(readinessFor({ ...ready, daysSinceLastTrained: 15 })).toBe("needs-work");
  });
  it("fewer than 5 passed = not practiced", () => {
    expect(readinessFor({ ...ready, passedCount: 4 })).toBe("not-practiced");
  });
});
