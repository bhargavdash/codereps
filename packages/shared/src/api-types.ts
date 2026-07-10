/**
 * API response contracts shared by apps/api (producer) and apps/web
 * (consumer). Keep in lockstep with the route selects — the gating tests in
 * apps/api assert the actual payload shape.
 */

import type { Category, Language, Mode, Runner, SubmissionStatus } from "./domain.js";
import type { ChallengeTests } from "./challenge-schema.js";

/** GET /api/v1/challenges list item — metadata only (LIST_SELECT). */
export interface ChallengeMeta {
  id: string;
  slug: string;
  title: string;
  category: Category;
  mode: Mode;
  difficulty: number;
  runner: Runner;
  language: Language;
  parSeconds: number;
  timeLimitSeconds: number;
  tags: string[];
  version: number;
}

export interface ChallengeListResponse {
  challenges: ChallengeMeta[];
  nextCursor: string | null;
}

/** GET /api/v1/challenges/:slug — practice payload; solution fields never appear. */
export interface ChallengeDetail extends ChallengeMeta {
  promptMd: string;
  starterCode: string;
  tests: ChallengeTests;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeDetailResponse {
  challenge: ChallengeDetail;
}

/** GET /api/v1/warmup — today's 3, persisted per (user, date) (S4-4/S5-2). */
export interface WarmupRepEntry {
  n: number;
  kind: "review" | "weak-spot" | "new";
  done: boolean;
  challenge: ChallengeMeta;
}

/** GET /api/v1/me/summary — dashboard + shell data (S5-5). */
export interface CategorySummary {
  category: Category;
  /** §9 category score over displayed (decayed) fluencies; null until ≥5 passed. */
  score: number | null;
  readiness: "ready" | "needs-work" | "not-practiced";
  passedCount: number;
  attemptedCount: number;
  passedAtD4Plus: number;
  daysSinceLastTrained: number | null;
  /** mean per-submission fluency per active day, oldest→newest (≤14 points). */
  trend: { date: string; score: number }[];
}

export interface MeSummaryResponse {
  streak: {
    current: number;
    longest: number;
    qualifiedToday: boolean;
    /** hour (0-23) in the user's timezone when the summary was computed. */
    localHour: number;
    /**
     * true when a real gap (missed ≥1 full day) has happened since `current`
     * was last written — the Streak row only resets lazily on the next
     * qualifying submission, so this is the read-time signal that a
     * returning user's streak has already died even though `current` (still
     * the stale pre-reset value here) hasn't caught up yet. Exists to drive
     * the `streak_broken` analytics event on warmup load.
     */
    justBroken: boolean;
    /** the streak length that just broke, for messaging/analytics — null unless justBroken. */
    brokenLength: number | null;
  };
  totals: { activeDays: number; totalReps: number; totalPasses: number };
  categories: CategorySummary[];
}

/** GET /api/v1/me/heatmap — DailyActivity range (S5-4). */
export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  submissions: number;
  passes: number;
  minutesActive: number;
}

export interface HeatmapResponse {
  from: string;
  to: string;
  days: HeatmapDay[];
}

export interface WarmupResponse {
  date: string;
  reps: WarmupRepEntry[];
}

/** POST /api/v1/attempts — the server-attested rep start (S3-1). */
export interface AttemptResponse {
  attemptId: string;
  /** ISO timestamp from the server clock — the only clock that counts. */
  startedAt: string;
  timeLimitSeconds: number;
}

export interface SubmissionSummary {
  id: string;
  status: SubmissionStatus;
  testsPassed: number;
  testsTotal: number;
  durationMs: number;
  keystrokes: number;
  pasteAttempts: number;
  createdAt: string;
}

export interface StreakSummary {
  current: number;
  longest: number;
  /** true when this submission is what qualified today. */
  qualifiedToday: boolean;
}

/**
 * POST /api/v1/attempts/:id/submit — the ONLY response that ever carries
 * solutionCode (will-bite #2). Abandon returns the same shape.
 */
export interface SubmitResponse {
  submission: SubmissionSummary;
  fluency: {
    score: number | null;
    ema: number | null;
    best: number | null;
    isPersonalBest: boolean;
  };
  streak: StreakSummary;
  solutionCode: string;
  solutionNotesMd: string | null;
}
