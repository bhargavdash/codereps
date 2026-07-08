/**
 * SM-2 lite (§9) — the scheduling brain behind warmup v2 (S5-2).
 *
 * pass: interval walks 1 → 3 → 7 → 14 → round(prev × ease)
 *       score ≥90 nudges ease +0.05 (cap 2.8)
 * fail: interval resets to 1, ease −0.2 (floor 1.3)
 * abandoned: untouched (handled by the caller never invoking this)
 */

export interface SrsState {
  intervalDays: number;
  ease: number;
}

export const SRS_DEFAULT: SrsState = { intervalDays: 0, ease: 2.5 };

const LADDER = [1, 3, 7, 14];

export function srsAfterSubmission(
  prev: SrsState,
  outcome: { passed: boolean; score: number | null },
): SrsState & { nextReviewInDays: number } {
  if (!outcome.passed) {
    const ease = round2(Math.max(1.3, prev.ease - 0.2));
    return { intervalDays: 1, ease, nextReviewInDays: 1 };
  }

  const ease =
    outcome.score !== null && outcome.score >= 90
      ? round2(Math.min(2.8, prev.ease + 0.05))
      : prev.ease;

  let intervalDays: number;
  const rung = LADDER.findIndex((step) => prev.intervalDays < step);
  if (rung !== -1) {
    intervalDays = LADDER[rung]!;
  } else {
    intervalDays = Math.round(prev.intervalDays * ease);
  }

  return { intervalDays, ease, nextReviewInDays: intervalDays };
}

/** nextReviewAt from a submission instant. */
export function nextReviewDate(from: Date, inDays: number): Date {
  return new Date(from.getTime() + inDays * 24 * 3600 * 1000);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
