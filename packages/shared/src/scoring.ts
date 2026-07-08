/**
 * Fluency scoring v0 — architecture §9, consumed by the S3-2 submit
 * transaction. Sprint 5 (S5-1) extends this module with decay + category
 * scores; the per-submission formula and EMA live here from day one so the
 * transaction never hand-rolls math.
 */

import type { SubmissionStatus } from "./domain.js";

export interface FluencyInput {
  status: SubmissionStatus;
  casesPassed: number;
  casesTotal: number;
  parSeconds: number;
  durationSeconds: number;
}

/**
 * Per-submission fluency:
 *   pass → 60 + 40 × min(1, par/duration)   (at or under par = 100; 2×par = 80)
 *   fail/error/timeout → 40 × casesPassed/casesTotal
 *   abandoned → null (no score — the rep ended without a real result)
 */
export function fluencyForSubmission(input: FluencyInput): number | null {
  if (input.status === "abandoned") return null;

  if (input.status === "passed") {
    const duration = Math.max(1, input.durationSeconds);
    const speed = Math.min(1, input.parSeconds / duration);
    return round2(60 + 40 * speed);
  }

  if (input.casesTotal <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, input.casesPassed / input.casesTotal));
  return round2(40 * ratio);
}

/** EMA with α = 0.5: the new rep and the history weigh equally. */
export function emaFluency(previous: number | null | undefined, next: number): number {
  if (previous === null || previous === undefined) return round2(next);
  return round2(0.5 * next + 0.5 * previous);
}

/**
 * Decay — the thesis, operationalized (§9): skills atrophy in the product
 * exactly as in life. A week's grace, then 1.5%/day off the EMA, floored at
 * 60% of it.
 */
export function displayedFluency(ema: number, daysSinceLastPass: number): number {
  const factor = Math.max(0.6, 1 - 0.015 * Math.max(0, daysSinceLastPass - 7));
  return round2(ema * factor);
}

/**
 * Category score (§9): mean of the top-10 displayed fluencies; needs ≥5
 * challenges passed in the category to show at all.
 */
export function categoryFluency(displayedScores: number[], passedChallengeCount: number): number | null {
  if (passedChallengeCount < 5 || displayedScores.length === 0) return null;
  const top = [...displayedScores].sort((a, b) => b - a).slice(0, 10);
  return round2(top.reduce((a, b) => a + b, 0) / top.length);
}

export type Readiness = "ready" | "needs-work" | "not-practiced";

export interface ReadinessInput {
  categoryScore: number | null;
  passedCount: number;
  passedAtD4Plus: number;
  daysSinceLastTrained: number | null;
}

/**
 * Readiness tiers (§9):
 *   Ready         = score ≥80 AND ≥8 passed incl. ≥2 at difficulty ≥4 AND practiced ≤14d
 *   Needs work    = ≥5 passed but the score/recency bar fails
 *   Not practiced = <5 passed
 */
export function readinessFor(input: ReadinessInput): Readiness {
  if (input.passedCount < 5) return "not-practiced";
  const ready =
    input.categoryScore !== null &&
    input.categoryScore >= 80 &&
    input.passedCount >= 8 &&
    input.passedAtD4Plus >= 2 &&
    input.daysSinceLastTrained !== null &&
    input.daysSinceLastTrained <= 14;
  return ready ? "ready" : "needs-work";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
