import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "implement-exclude",
  title: "Implement Exclude",
  category: "typescript",
  mode: "pattern_drill",
  difficulty: 2,
  runner: "ts_check",
  language: "typescript",
  promptMd: `Distributive conditional types — the union filter.

- Define \`MyExclude<T, U>\` removing from union \`T\` every member assignable to \`U\`.
- Don't use the built-in \`Exclude\`.

Behaves like: \`MyExclude<"a" | "b" | "c", "a">\` is \`"b" | "c"\`.`,
  starterCode: `type MyExclude<T, U> = unknown; // make this real
`,
  solutionCode: `type MyExclude<T, U> = T extends U ? never : T;
`,
  solutionNotesMd:
    "The whole trick is DISTRIBUTION: a conditional over a bare type parameter runs once per union member, and `never` members vanish when the union reassembles. Wrap either side in `[T] extends [U]` and distribution — and the filter — is gone.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "ts_check",
    cases: [
      {
        name: "removes a single member",
        assertion: 'type _T1 = Expect<Equal<MyExclude<"a" | "b" | "c", "a">, "b" | "c">>;',
      },
      {
        name: "removes by assignability, not identity",
        assertion: 'type _T2 = Expect<Equal<MyExclude<string | number | (() => void), Function>, string | number>>;',
      },
      {
        name: "removing everything leaves never",
        assertion: 'type _T3 = Expect<Equal<MyExclude<"a" | "b", "a" | "b">, never>>;',
      },
    ],
  },
  parSeconds: 180, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 900,
  tags: ["conditional-types", "unions", "par-unverified"],
});
