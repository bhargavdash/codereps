import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "implement-omit",
  title: "Implement Omit",
  category: "typescript",
  mode: "pattern_drill",
  difficulty: 3,
  runner: "ts_check",
  language: "typescript",
  promptMd: `Compose the utilities you've built: Omit = Pick + Exclude, or key remapping if you're feeling modern.

- Define \`MyOmit<T, K>\` producing \`T\` without the keys in \`K\`.
- \`K\` must be constrained to keys of \`T\`.
- Don't use the built-ins \`Omit\` or \`Pick\`.`,
  starterCode: `type MyOmit<T, K extends keyof T> = unknown; // make this real
`,
  solutionCode: `type MyOmit<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};
`,
  solutionNotesMd:
    "The `as` clause remaps keys during mapping; remapping to `never` DROPS the key. The classic alternative — `{ [P in MyExclude<keyof T, K>]: T[P] }` — is the same idea with the filter done before the mapping instead of during it.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "ts_check",
    cases: [
      {
        name: "omits a single key",
        assertion:
          'type _T1 = Expect<Equal<MyOmit<{ title: string; done: boolean }, "done">, { title: string }>>;',
      },
      {
        name: "omits a union of keys",
        assertion:
          'type _T2 = Expect<Equal<MyOmit<{ a: 1; b: 2; c: 3 }, "a" | "c">, { b: 2 }>>;',
      },
      {
        name: "optionality survives the omit",
        assertion:
          'type _T3 = Expect<Equal<MyOmit<{ id: number; note?: string }, "id">, { note?: string }>>;',
      },
      {
        name: "rejects keys that don't exist on T",
        assertion: '// @ts-expect-error K must be constrained to keyof T\ntype _T4 = MyOmit<{ a: 1 }, "z">;',
      },
    ],
  },
  parSeconds: 270, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 1200,
  tags: ["mapped-types", "key-remapping", "par-unverified"],
});
