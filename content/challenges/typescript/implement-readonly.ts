import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "implement-readonly",
  title: "Implement Readonly",
  category: "typescript",
  mode: "pattern_drill",
  difficulty: 1,
  runner: "ts_check",
  language: "typescript",
  promptMd: `Rebuild the built-in \`Readonly\` utility — the mapped-type modifier rep.

- Define \`MyReadonly<T>\` where every property of \`T\` becomes \`readonly\`.
- Keys and value types are otherwise unchanged.
- Don't use the built-in \`Readonly\`.`,
  starterCode: `type MyReadonly<T> = unknown; // make this real
`,
  solutionCode: `type MyReadonly<T> = {
  readonly [P in keyof T]: T[P];
};
`,
  solutionNotesMd:
    "Modifiers (`readonly`, `?`) sit on the mapped-type slot itself. The sibling moves worth knowing cold: `-readonly` strips it, `+?`/`-?` do the same dance for optionality.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "ts_check",
    cases: [
      {
        name: "marks every property readonly",
        assertion:
          'type _T1 = Expect<Equal<MyReadonly<{ title: string; done: boolean }>, { readonly title: string; readonly done: boolean }>>;',
      },
      {
        name: "value types are preserved",
        assertion:
          "type _T2 = Expect<Equal<MyReadonly<{ n: 42 }>, { readonly n: 42 }>>;",
      },
      {
        name: "assignment to a property is an error",
        assertion:
          '// @ts-expect-error properties must be readonly\nconst _bad = (() => { const o: MyReadonly<{ a: number }> = { a: 1 }; o.a = 2; return o; })();',
      },
    ],
  },
  parSeconds: 120, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 600,
  tags: ["mapped-types", "modifiers", "par-unverified"],
});
