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
