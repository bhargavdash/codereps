import { getChallenge } from "./challenges";
import type { LibraryRow, ReadinessRow, WarmupRep } from "./types";

export const USER = { initials: "JK", name: "Jordan K." };
export const STREAK = { days: 14, alive: true };

/** Today's warmup — one session sheet, three reps. */
// Warmup mock removed 2026-07-07 (S4-4): WarmupScreen reads GET /api/v1/warmup.
/** Debrief summary for the just-submitted debounce rep — reads like a race result. */
export const DEBRIEF = {
  slug: "debounce",
  verdict: "pass" as const,
  timeSeconds: 221, // 3:41
  parSeconds: 240,
  isPR: true,
  prevBestSeconds: 243, // 4:03
  fluency: 88,
  casesPassed: 5,
  casesTotal: 5,
  parRatio: "0.92× par",
  faults: 0,
  unaided: true,
  note: "Correct on every case, under par, no hints — but one dead variable kept it off 90.",
  linesDiffer: 3,
  totalTestMs: 11,
  /** line indices (0-based) highlighted amber in "your rep" — the dead variable + its use */
  yourDiffLines: [2, 4],
  /** line indices highlighted green in the reference — the tighter equivalent */
  refDiffLines: [3, 7, 9],
};

export const LOG_TOTALS = { days: 371, reps: 248 };

/** last 7 days as heat levels; the final day is "today", stamped amber. */
export const LAST_7: { level: number; today?: boolean }[] = [
  { level: 2 },
  { level: 1 },
  { level: 3 },
  { level: 0 },
  { level: 2 },
  { level: 3 },
  { level: 4, today: true },
];

/**
 * Year heatmap — seeded deterministic levels (0–4), ported verbatim from the
 * design's dc-script so the texture matches the prototype exactly.
 */
export function buildHeatLevels(): number[] {
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const N = 371;
  const cells: number[] = [];
  for (let i = 0; i < N; i++) {
    const recency = i / N;
    let level: number;
    const r = rnd();
    if (r < 0.34 - recency * 0.2) level = 0;
    else level = 1 + Math.floor(rnd() * (1 + recency * 3.4));
    if (i > N - 15) level = Math.max(level, 2 + Math.floor(rnd() * 3));
    level = Math.max(0, Math.min(4, level));
    cells.push(level);
  }
  return cells;
}

export const READINESS: ReadinessRow[] = [
  {
    label: "JavaScript",
    readiness: "sharp",
    evidence: "21 passed · PR on debounce · trained today",
    fluency: 91,
    trend: [0.18, 0.3, 0.42, 0.5, 0.63, 0.74, 0.85],
    rising: true,
  },
  {
    label: "React",
    readiness: "ready",
    evidence: "12 passed · 3 at D4+ · trained 2d ago",
    fluency: 84,
    trend: [0.4, 0.46, 0.42, 0.6, 0.63, 0.66, 0.7],
    rising: true,
  },
  {
    label: "CSS Layout",
    readiness: "ready",
    evidence: "8 passed · steady · trained 4d ago",
    fluency: 78,
    trend: [0.58, 0.6, 0.63, 0.6, 0.66, 0.66, 0.69],
    rising: true,
  },
  {
    label: "TypeScript",
    readiness: "needs-work",
    evidence: "decaying · −14 in 9 days · last trained 9d ago",
    fluency: 61,
    trend: [0.78, 0.8, 0.72, 0.62, 0.5, 0.34, 0.2],
    rising: false,
  },
  {
    label: "Algorithms",
    readiness: "needs-work",
    evidence: "2 timeouts this week · last trained 6d ago",
    fluency: 58,
    trend: [0.72, 0.74, 0.64, 0.58, 0.46, 0.34, 0.2],
    rising: false,
  },
  {
    label: "System Design",
    readiness: "untrained",
    evidence: "No reps yet — your first one sets the baseline.",
    fluency: null,
    trend: [],
    rising: false,
  },
];

// Library mock data removed 2026-07-05 (S1-6): LibraryScreen now reads the
// real challenges API via useLibraryRows.
