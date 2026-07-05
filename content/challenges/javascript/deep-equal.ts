import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "deep-equal",
  title: "Deep equal",
  category: "javascript",
  mode: "pattern_drill",
  difficulty: 4,
  runner: "js_worker",
  language: "javascript",
  promptMd: `Write a structural equality check from memory — the heart of every assertion library.

- \`deepEqual(a, b)\` returns \`true\` when the two values have the same structure and contents.
- Primitives compare by value; \`NaN\` equals \`NaN\` (use \`Object.is\` semantics).
- Arrays: same length, elements deep-equal in order.
- Plain objects: same own enumerable keys, values deep-equal — key order must not matter.
- Mismatched types (array vs object, object vs null) are never equal.

No need to handle Map/Set/Date/circular references — plain JSON-shaped data only.`,
  starterCode: `function deepEqual(a, b) {

}
`,
  solutionCode: `function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every(
    (key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]),
  );
}
`,
  solutionNotesMd:
    "Three gates before recursion: `Object.is` handles all primitives (including NaN and ±0), the null/typeof gate rejects mixed primitive-vs-object pairs, and the `Array.isArray` XOR gate rejects array-vs-object. After that, arrays and objects share one code path — `Object.keys` works for both.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "deepEqual",
    cases: [
      { type: "call", name: "equal primitives", args: [7, 7], expected: true },
      {
        // script case: NaN can't live in call args — tests are stored as jsonb
        type: "script",
        name: "NaN equals NaN",
        script: `t.equal(subject(NaN, NaN), true, "Object.is semantics");`,
      },
      { type: "call", name: "null is not an empty object", args: [null, {}], expected: false },
      {
        type: "call",
        name: "nested objects, key order ignored",
        args: [
          { a: 1, b: { c: [1, 2], d: "x" } },
          { b: { d: "x", c: [1, 2] }, a: 1 },
        ],
        expected: true,
      },
      {
        type: "call",
        name: "arrays compare in order",
        args: [
          [1, 2, 3],
          [1, 3, 2],
        ],
        expected: false,
      },
      { type: "call", name: "array is not an object with same keys", args: [[1], { 0: 1 }], expected: false },
      {
        type: "call",
        name: "missing key vs extra key",
        args: [{ a: 1 }, { a: 1, b: 2 }],
        expected: false,
      },
      {
        type: "call",
        name: "deep mismatch is found",
        args: [{ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } }],
        expected: false,
      },
    ],
  },
  parSeconds: 360, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 1200,
  tags: ["recursion", "objects", "par-unverified"],
});
