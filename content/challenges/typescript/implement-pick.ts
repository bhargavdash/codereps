import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "implement-pick",
  title: "Implement Pick",
  category: "typescript",
  mode: "pattern_drill",
  difficulty: 2,
  runner: "ts_check",
  language: "typescript",
  promptMd: `Rebuild the built-in \`Pick\` utility type from scratch — the gateway mapped type.

- Define \`MyPick<T, K>\` producing an object type with only the keys of \`T\` listed in \`K\`.
- Value types must be preserved exactly.
- \`K\` must be constrained so picking a key that doesn't exist on \`T\` is a **type error**.
- Don't use the built-in \`Pick\`.`,
  starterCode: `type MyPick<T, K> = unknown; // make this real
`,
  solutionCode: `type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
`,
  solutionNotesMd:
    "Two moves: the constraint `K extends keyof T` (which is what makes bad keys an error) and the mapped type `[P in K]: T[P]` (iterate the union, index the original). Every fancier utility — Omit, Readonly, Partial — is a riff on this shape.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "ts_check",
    cases: [
      {
        name: "picks a single key",
        assertion: 'type _T1 = Expect<Equal<MyPick<{ a: 1; b: 2 }, "a">, { a: 1 }>>;',
      },
      {
        name: "picks a union of keys",
        assertion:
          'type _T2 = Expect<Equal<MyPick<{ a: 1; b: 2; c: 3 }, "a" | "c">, { a: 1; c: 3 }>>;',
      },
      {
        name: "preserves value types exactly",
        assertion:
          'type _T3 = Expect<Equal<MyPick<{ id: number; name?: string }, "name">, { name?: string }>>;',
      },
      {
        name: "rejects keys that don't exist on T",
        assertion: '// @ts-expect-error K must be constrained to keyof T\ntype _T4 = MyPick<{ a: 1 }, "z">;',
      },
    ],
  },
  parSeconds: 180, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 900,
  tags: ["mapped-types", "generics", "par-unverified"],
});
