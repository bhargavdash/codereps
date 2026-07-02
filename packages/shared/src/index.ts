/**
 * @codereps/shared — types and schemas shared across web + api.
 *
 * Domain vocabulary mirrors packages/db/prisma/schema.prisma.
 * The Zod challenge-file schema lands here in board task S1-1.
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
