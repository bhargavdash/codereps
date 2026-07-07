import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "first-of-array",
  title: "First of array",
  category: "typescript",
  mode: "pattern_drill",
  difficulty: 1,
  runner: "ts_check",
  language: "typescript",
  promptMd: `Conditional types + tuple inference — the \`infer\` opener.

- Define \`First<T>\` that resolves to the type of a tuple's first element.
- An empty tuple resolves to \`never\`.`,
  starterCode: `type First<T extends readonly unknown[]> = unknown; // make this real
`,
  solutionCode: `type First<T extends readonly unknown[]> = T extends readonly [infer F, ...unknown[]]
  ? F
  : never;
`,
  solutionNotesMd:
    "`infer F` names the slot you're extracting; the conditional's false arm handles `[]` for free because an empty tuple can't match `[infer F, ...rest]`. Indexing with `T[0]` almost works — but gives `undefined`, not `never`, for `[]`.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "ts_check",
    cases: [
      {
        name: "extracts the first element type",
        assertion: 'type _T1 = Expect<Equal<First<[string, number, boolean]>, string>>;',
      },
      {
        name: "preserves literal types",
        assertion: 'type _T2 = Expect<Equal<First<[3, 2, 1]>, 3>>;',
      },
      {
        name: "empty tuple resolves to never",
        assertion: "type _T3 = Expect<Equal<First<[]>, never>>;",
      },
    ],
  },
  parSeconds: 150, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 600,
  tags: ["conditional-types", "infer", "par-unverified"],
});
