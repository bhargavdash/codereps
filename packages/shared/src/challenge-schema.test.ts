import { describe, expect, it } from "vitest";
import { ChallengeFileSchema, TESTS_SCHEMA_VERSION } from "./challenge-schema.js";

/** Hand-written sample — a realistic js_worker challenge using both case styles. */
const groupBy = {
  slug: "group-by",
  title: "groupBy",
  category: "javascript",
  mode: "pattern_drill",
  difficulty: 2,
  runner: "js_worker",
  language: "javascript",
  promptMd: "Implement `groupBy(items, keyFn)` returning a plain object of arrays.",
  starterCode: "function groupBy(items, keyFn) {\n  // your rep\n}\n",
  solutionCode:
    "function groupBy(items, keyFn) {\n  const out = {};\n  for (const item of items) {\n    (out[keyFn(item)] ??= []).push(item);\n  }\n  return out;\n}\n",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "groupBy",
    cases: [
      {
        type: "call",
        name: "groups numbers by parity",
        args: [[1, 2, 3, 4], "__FN__:(n) => n % 2 === 0 ? 'even' : 'odd'"],
        expected: { odd: [1, 3], even: [2, 4] },
      },
      {
        type: "script",
        name: "calls keyFn once per item",
        script:
          "let calls = 0;\nsubject([1, 2, 3], () => { calls += 1; return 'k'; });\nt.equal(calls, 3);",
      },
    ],
  },
  parSeconds: 180,
  timeLimitSeconds: 600,
  tags: ["objects", "iteration"],
} as const;

describe("ChallengeFileSchema", () => {
  it("accepts a hand-written js_worker sample and applies defaults", () => {
    const parsed = ChallengeFileSchema.parse(groupBy);
    expect(parsed.isPublished).toBe(true);
    expect(parsed.tests.kind).toBe("js_worker");
    if (parsed.tests.kind === "js_worker") {
      expect(parsed.tests.needsFakeClock).toBe(false);
    }
  });

  it("accepts a ts_check challenge", () => {
    const result = ChallengeFileSchema.safeParse({
      ...groupBy,
      slug: "implement-pick",
      title: "Implement Pick",
      category: "typescript",
      runner: "ts_check",
      language: "typescript",
      tests: {
        schemaVersion: TESTS_SCHEMA_VERSION,
        kind: "ts_check",
        cases: [
          {
            name: "picks a single key",
            assertion:
              'type _T1 = Expect<Equal<MyPick<{ a: 1; b: 2 }, "a">, { a: 1 }>>;',
          },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  // -- the 5 deliberately broken ones -------------------------------------

  it("rejects a runner / tests.kind mismatch", () => {
    const result = ChallengeFileSchema.safeParse({ ...groupBy, runner: "ts_check" });
    expect(result.success).toBe(false);
  });

  it("rejects a wrong tests schemaVersion", () => {
    const result = ChallengeFileSchema.safeParse({
      ...groupBy,
      tests: { ...groupBy.tests, schemaVersion: 2 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range difficulty", () => {
    const result = ChallengeFileSchema.safeParse({ ...groupBy, difficulty: 7 });
    expect(result.success).toBe(false);
  });

  it("rejects an empty cases array", () => {
    const result = ChallengeFileSchema.safeParse({
      ...groupBy,
      tests: { ...groupBy.tests, cases: [] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a time limit below par", () => {
    const result = ChallengeFileSchema.safeParse({
      ...groupBy,
      parSeconds: 600,
      timeLimitSeconds: 300,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-kebab-case slug", () => {
    const result = ChallengeFileSchema.safeParse({ ...groupBy, slug: "Group By!" });
    expect(result.success).toBe(false);
  });

  it("rejects a language the runner cannot execute", () => {
    const result = ChallengeFileSchema.safeParse({ ...groupBy, language: "css" });
    expect(result.success).toBe(false);
  });
});
