/**
 * Domain vocabulary shared across web + api.
 * Mirrors packages/db/prisma/schema.prisma — keep the two in lockstep.
 */

export const CATEGORIES = [
  "react",
  "dsa",
  "typescript",
  "javascript",
  "css",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const MODES = [
  "pattern_drill",
  "syntax_sprint",
  "component_recall",
  "interview_sim",
] as const;
export type Mode = (typeof MODES)[number];

export const RUNNERS = [
  "js_worker",
  "react_iframe",
  "ts_check",
  "css_iframe",
] as const;
export type Runner = (typeof RUNNERS)[number];

export const SUBMISSION_STATUSES = [
  "passed",
  "failed",
  "error",
  "timeout",
  "abandoned",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const LANGUAGES = ["javascript", "typescript", "tsx", "css"] as const;
export type Language = (typeof LANGUAGES)[number];

/** Which languages each runner can execute — enforced by the challenge schema. */
export const RUNNER_LANGUAGES: Record<Runner, readonly Language[]> = {
  js_worker: ["javascript", "typescript"],
  react_iframe: ["tsx"],
  ts_check: ["typescript"],
  css_iframe: ["css"],
};
