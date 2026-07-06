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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
