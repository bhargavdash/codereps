/**
 * API response contracts shared by apps/api (producer) and apps/web
 * (consumer). Keep in lockstep with the route selects — the gating tests in
 * apps/api assert the actual payload shape.
 */

import type { Category, Language, Mode, Runner } from "./domain.js";
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
