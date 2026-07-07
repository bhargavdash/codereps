import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "tuple-to-object",
  title: "Tuple to object",
  category: "typescript",
  mode: "pattern_drill",
  difficulty: 2,
  runner: "ts_check",
  language: "typescript",
  promptMd: `Indexed access over a tuple — \`T[number]\` is the move.

- Define \`TupleToObject<T>\` turning a tuple of literals into an object whose keys AND values are those literals.
- Example: \`["a", "b"]\` becomes \`{ a: "a"; b: "b" }\`.
- Constrain \`T\` so only tuples of valid property keys are accepted.`,
  starterCode: `type TupleToObject<T extends readonly PropertyKey[]> = unknown; // make this real
`,
  solutionCode: `type TupleToObject<T extends readonly PropertyKey[]> = {
  [P in T[number]]: P;
};
`,
  solutionNotesMd:
    "`T[number]` indexes a tuple by 'any numeric index' → the union of its element types. Mapping over that union gives one property per element; the value is just `P` again.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "ts_check",
    cases: [
      {
        name: "string literal tuple",
        assertion:
          'type _T1 = Expect<Equal<TupleToObject<["tesla", "model3"]>, { tesla: "tesla"; model3: "model3" }>>;',
      },
      {
        name: "numeric literals work as keys",
        assertion: "type _T2 = Expect<Equal<TupleToObject<[1, 2]>, { 1: 1; 2: 2 }>>;",
      },
      {
        name: "empty tuple gives an empty object",
        assertion: "type _T3 = Expect<Equal<TupleToObject<[]>, {}>>;",
      },
      {
        name: "rejects tuples of non-key types",
        assertion: "// @ts-expect-error object elements can't be property keys\ntype _T4 = TupleToObject<[{ x: 1 }]>;",
      },
    ],
  },
  parSeconds: 210, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 900,
  tags: ["mapped-types", "indexed-access", "par-unverified"],
});
