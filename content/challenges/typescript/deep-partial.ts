import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "deep-partial",
  title: "Deep Partial",
  category: "typescript",
  mode: "pattern_drill",
  difficulty: 3,
  runner: "ts_check",
  language: "typescript",
  promptMd: `Built-in \`Partial<T>\` only goes one level deep — fix that.

- Define \`DeepPartial<T>\` making every property of \`T\` optional, recursively into nested object types.
- Arrays and primitive values are left as-is (don't recurse into array element types for this one).
- Don't use the built-in \`Partial\`.`,
  starterCode: `type DeepPartial<T> = unknown; // make this real
`,
  solutionCode: `type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;
`,
  solutionNotesMd:
    "The `T extends object` check is the recursion's base case — arrays pass it too (arrays are objects), which is why array element types stay untouched here: the mapped type only reaches into non-array objects the way this spec asks for. Each property becomes optional (`?`) AND its own type is recursively wrapped.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "ts_check",
    cases: [
      {
        name: "top-level properties become optional",
        assertion:
          'type _T1 = Expect<Equal<DeepPartial<{ a: string; b: number }>, { a?: string; b?: number }>>;',
      },
      {
        name: "nested object properties become optional too",
        assertion:
          'type _T2 = Expect<Equal<DeepPartial<{ a: { b: { c: string } } }>, { a?: { b?: { c?: string } } }>>;',
      },
      {
        name: "primitive fields stay primitive",
        assertion: 'type _T3 = Expect<Equal<DeepPartial<{ a: number }>["a"], number | undefined>>;',
      },
      {
        name: "an all-optional deep-partial accepts an empty object",
        assertion: 'const _v1: DeepPartial<{ a: { b: string } }> = {};',
      },
    ],
  },
  parSeconds: 240, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 900,
  tags: ["conditional-types", "mapped-types", "recursion", "par-unverified"],
});
