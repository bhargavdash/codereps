import { describe, expect, it } from "vitest";
import { emaFluency, fluencyForSubmission } from "./scoring.js";

describe("fluencyForSubmission (architecture §9 worked examples)", () => {
  const base = { casesPassed: 5, casesTotal: 5, parSeconds: 240 };

  it("pass at par or faster scores 100", () => {
    expect(fluencyForSubmission({ ...base, status: "passed", durationSeconds: 240 })).toBe(100);
    expect(fluencyForSubmission({ ...base, status: "passed", durationSeconds: 120 })).toBe(100);
  });

  it("pass at 2× par scores 80", () => {
    expect(fluencyForSubmission({ ...base, status: "passed", durationSeconds: 480 })).toBe(80);
  });

  it("pass floor approaches 60 as duration grows", () => {
    const slow = fluencyForSubmission({ ...base, status: "passed", durationSeconds: 240 * 50 });
    expect(slow).toBeGreaterThan(60);
    expect(slow).toBeLessThan(61);
  });

  it("fail scores by case ratio: 3/5 → 24", () => {
    expect(
      fluencyForSubmission({ status: "failed", casesPassed: 3, casesTotal: 5, parSeconds: 240, durationSeconds: 100 }),
    ).toBe(24);
  });

  it("timeout and error use the fail formula", () => {
    expect(
      fluencyForSubmission({ status: "timeout", casesPassed: 0, casesTotal: 5, parSeconds: 240, durationSeconds: 999 }),
    ).toBe(0);
    expect(
      fluencyForSubmission({ status: "error", casesPassed: 2, casesTotal: 4, parSeconds: 240, durationSeconds: 10 }),
    ).toBe(20);
  });

  it("abandoned yields no score", () => {
    expect(
      fluencyForSubmission({ status: "abandoned", casesPassed: 0, casesTotal: 5, parSeconds: 240, durationSeconds: 30 }),
    ).toBeNull();
  });
});

describe("emaFluency (α = 0.5)", () => {
  it("first score becomes the EMA", () => {
    expect(emaFluency(null, 84)).toBe(84);
  });
  it("averages new and previous equally", () => {
    expect(emaFluency(80, 100)).toBe(90);
    expect(emaFluency(90, 24)).toBe(57);
  });
});
