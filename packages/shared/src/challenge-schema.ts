/**
 * Challenge-file schema — board task S1-1, architecture §4/§7.
 *
 * Every file under content/challenges/<category>/<slug>.ts default-exports an
 * object that must parse with ChallengeFileSchema. verify-content (S1-2) is the
 * CI gate; the seed script (S1-4) upserts parsed files into Postgres.
 *
 * The `tests` payload is a discriminated union by runner and carries its own
 * schemaVersion (architecture will-bite #4: it lands in an untyped jsonb
 * column, so the version must travel inside the payload).
 */

import { z } from "zod";
import {
  CATEGORIES,
  LANGUAGES,
  MODES,
  RUNNER_LANGUAGES,
  RUNNERS,
} from "./domain.js";

export const TESTS_SCHEMA_VERSION = 1;

const schemaVersion = z.literal(TESTS_SCHEMA_VERSION);
const caseName = z.string().min(1);
/** Per-case deadline; the runner applies 1000ms when absent (architecture §6). */
const timeoutMs = z.number().int().min(1).max(10_000).optional();

// ---------------------------------------------------------------------------
// js_worker — DSA / JS utility challenges
// ---------------------------------------------------------------------------

/**
 * Declarative case: call entryPoint(...args), deep-equal the return value.
 * `tests` is stored as jsonb, so function-valued args are encoded as strings
 * prefixed "__FN__:" (e.g. "__FN__:(n) => n * 2"); runner-core revives them.
 */
export const JsWorkerCallCaseSchema = z.object({
  type: z.literal("call"),
  name: caseName,
  args: z.array(z.unknown()),
  expected: z.unknown(),
  timeoutMs,
});

/**
 * Imperative case for behavior that args/expected can't express (spies,
 * debounce/throttle under the fake clock). `script` is the body of an async
 * function `(subject, t) => { ... }` where `subject` is the user's entryPoint
 * and `t` exposes assertion helpers plus `t.clock` when needsFakeClock.
 * The case fails by throwing.
 */
export const JsWorkerScriptCaseSchema = z.object({
  type: z.literal("script"),
  name: caseName,
  script: z.string().min(1),
  timeoutMs,
});

export const JsWorkerTestsSchema = z.object({
  schemaVersion,
  kind: z.literal("js_worker"),
  /** Name of the function the starter/solution must define, e.g. "debounce". */
  entryPoint: z.string().min(1),
  /** Inject fake setTimeout/clearTimeout/Date.now — will-bite #9. */
  needsFakeClock: z.boolean().default(false),
  cases: z
    .array(z.discriminatedUnion("type", [JsWorkerCallCaseSchema, JsWorkerScriptCaseSchema]))
    .min(1),
});

// ---------------------------------------------------------------------------
// ts_check — type-level challenges (type-challenges pattern)
// ---------------------------------------------------------------------------

/**
 * Each case is its own snippet appended after the user's code; grading is
 * zero diagnostics. Splitting into cases lets diagnostics be attributed to a
 * named case for the splits UI instead of one opaque pass/fail.
 */
export const TsCheckTestsSchema = z.object({
  schemaVersion,
  kind: z.literal("ts_check"),
  cases: z
    .array(
      z.object({
        name: caseName,
        /** e.g. `type _T1 = Expect<Equal<MyPick<Todo, "title">, { title: string }>>;` */
        assertion: z.string().min(1),
      }),
    )
    .min(1),
});

// ---------------------------------------------------------------------------
// react_iframe — component challenges
// ---------------------------------------------------------------------------

export const ReactIframeTestsSchema = z.object({
  schemaVersion,
  kind: z.literal("react_iframe"),
  /** The component the user's code must define, mounted by the harness. */
  componentName: z.string().min(1),
  cases: z
    .array(
      z.object({
        name: caseName,
        /**
         * Body of an async function `(ctx) => { ... }` with
         * `{ container, React, ReactDOM, dom, t }` — dom = @testing-library/dom
         * queries. The case fails by throwing.
         */
        script: z.string().min(1),
        timeoutMs,
      }),
    )
    .min(1),
});

// ---------------------------------------------------------------------------
// css_iframe — layout challenges
// ---------------------------------------------------------------------------

export const CssAssertionSchema = z.object({
  selector: z.string().min(1),
  property: z.string().min(1),
  /** Compared against getComputedStyle(el).getPropertyValue(property). */
  expected: z.string().min(1),
});

export const CssIframeTestsSchema = z.object({
  schemaVersion,
  kind: z.literal("css_iframe"),
  /** The HTML the challenge renders; the user supplies only CSS. */
  markup: z.string().min(1),
  cases: z
    .array(
      z.object({
        name: caseName,
        viewportWidth: z.number().int().min(280).max(1920).optional(),
        assertions: z.array(CssAssertionSchema).min(1),
      }),
    )
    .min(1),
});

// ---------------------------------------------------------------------------
// The challenge file
// ---------------------------------------------------------------------------

export const ChallengeTestsSchema = z.discriminatedUnion("kind", [
  JsWorkerTestsSchema,
  TsCheckTestsSchema,
  ReactIframeTestsSchema,
  CssIframeTestsSchema,
]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TAG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ChallengeFileSchema = z
  .object({
    slug: z.string().regex(SLUG_RE, "slug must be kebab-case"),
    title: z.string().min(1),
    category: z.enum(CATEGORIES),
    mode: z.enum(MODES),
    difficulty: z.number().int().min(1).max(5),
    runner: z.enum(RUNNERS),
    language: z.enum(LANGUAGES),
    promptMd: z.string().min(1),
    /** May be empty — some reps start from a blank page. */
    starterCode: z.string(),
    solutionCode: z.string().min(1),
    solutionNotesMd: z.string().min(1).optional(),
    tests: ChallengeTestsSchema,
    /** Author's measured solve time (will-bite #5: from actually solving it). */
    parSeconds: z.number().int().min(10).max(3600),
    timeLimitSeconds: z.number().int().min(30).max(7200),
    tags: z.array(z.string().regex(TAG_RE, "tags are lowercase-hyphenated")).min(1),
    /** Content files ship publishable by default; drafts opt out explicitly. */
    isPublished: z.boolean().default(true),
  })
  .superRefine((challenge, ctx) => {
    if (challenge.tests.kind !== challenge.runner) {
      ctx.addIssue({
        code: "custom",
        path: ["tests", "kind"],
        message: `tests.kind "${challenge.tests.kind}" must match runner "${challenge.runner}"`,
      });
    }
    const allowed = RUNNER_LANGUAGES[challenge.runner];
    if (!allowed.includes(challenge.language)) {
      ctx.addIssue({
        code: "custom",
        path: ["language"],
        message: `runner "${challenge.runner}" supports languages: ${allowed.join(", ")}`,
      });
    }
    if (challenge.timeLimitSeconds < challenge.parSeconds) {
      ctx.addIssue({
        code: "custom",
        path: ["timeLimitSeconds"],
        message: "timeLimitSeconds must be ≥ parSeconds",
      });
    }
  });

export type ChallengeFile = z.infer<typeof ChallengeFileSchema>;
export type ChallengeTests = z.infer<typeof ChallengeTestsSchema>;
export type JsWorkerTests = z.infer<typeof JsWorkerTestsSchema>;
export type JsWorkerCase = JsWorkerTests["cases"][number];
export type TsCheckTests = z.infer<typeof TsCheckTestsSchema>;
export type ReactIframeTests = z.infer<typeof ReactIframeTestsSchema>;
export type CssIframeTests = z.infer<typeof CssIframeTestsSchema>;

/**
 * Authoring helper for content files — gives editor-time typing (input type:
 * defaults optional) while the real gate stays ChallengeFileSchema.parse in CI.
 */
export function defineChallenge(
  challenge: z.input<typeof ChallengeFileSchema>,
): z.input<typeof ChallengeFileSchema> {
  return challenge;
}
