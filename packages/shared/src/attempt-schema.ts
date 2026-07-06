/**
 * Attempt/submit wire contracts — board S3-1/S3-2. The Zod schemas are the
 * API's validation layer; the inferred types are what the web client sends.
 * The server never trusts client timing — duration is always
 * `server now − attempt.startedAt`; clientResults carry only what the
 * browser runner observed (case pass/fail), which the MVP accepts as
 * client-attested (architecture §6 threat model).
 */

import { z } from "zod";
import { SUBMISSION_STATUSES } from "./domain.js";

export const ClientCaseResultSchema = z.object({
  name: z.string().min(1).max(200),
  status: z.enum(["pass", "fail", "timeout", "error"]),
  ms: z.number().int().min(0).max(600_000),
  message: z.string().max(2000).optional(),
});

export const ClientResultsSchema = z.object({
  status: z.enum(SUBMISSION_STATUSES.filter((s) => s !== "abandoned") as ["passed", "failed", "error", "timeout"]),
  casesPassed: z.number().int().min(0).max(500),
  casesTotal: z.number().int().min(0).max(500),
  cases: z.array(ClientCaseResultSchema).max(500),
});

export const SubmitBodySchema = z.object({
  code: z.string().max(200_000),
  clientResults: ClientResultsSchema,
  metrics: z.object({
    keystrokes: z.number().int().min(0).max(1_000_000),
    pasteAttempts: z.number().int().min(0).max(10_000),
  }),
  /** gzip+base64 ghost trace (S2-3). */
  traceGz: z.string().max(400_000).optional(),
});

export const AbandonBodySchema = z.object({
  code: z.string().max(200_000).default(""),
  metrics: z
    .object({
      keystrokes: z.number().int().min(0).max(1_000_000),
      pasteAttempts: z.number().int().min(0).max(10_000),
    })
    .default({ keystrokes: 0, pasteAttempts: 0 }),
});

export const CreateAttemptBodySchema = z.object({
  challengeId: z.uuid(),
});

export type ClientCaseResult = z.infer<typeof ClientCaseResultSchema>;
export type ClientResults = z.infer<typeof ClientResultsSchema>;
export type SubmitBody = z.infer<typeof SubmitBodySchema>;
export type AbandonBody = z.infer<typeof AbandonBodySchema>;
export type CreateAttemptBody = z.infer<typeof CreateAttemptBodySchema>;
