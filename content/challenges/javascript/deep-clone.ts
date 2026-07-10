import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "deep-clone",
  title: "Deep clone",
  category: "javascript",
  mode: "pattern_drill",
  difficulty: 2,
  runner: "js_worker",
  language: "javascript",
  promptMd: `Rebuild \`structuredClone\` by hand for plain objects and arrays.

- \`deepClone(value)\` returns a deep copy: nested objects and arrays must not share references with the original.
- Primitives (numbers, strings, booleans, null, undefined) pass through unchanged.
- Don't call \`structuredClone\` or \`JSON.parse(JSON.stringify(...))\`.`,
  starterCode: `function deepClone(value) {

}
`,
  solutionCode: `function deepClone(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => deepClone(item));
  const out = {};
  for (const key of Object.keys(value)) {
    out[key] = deepClone(value[key]);
  }
  return out;
}
`,
  solutionNotesMd:
    "The primitive check (`typeof value !== \"object\"`, plus the explicit `null` guard since `typeof null === \"object\"`) is the recursion's base case. Arrays and objects each get their own reconstruction path so nested references never alias the original.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "deepClone",
    cases: [
      {
        type: "call",
        name: "clones a flat object",
        args: [{ a: 1, b: "two" }],
        expected: { a: 1, b: "two" },
      },
      {
        type: "call",
        name: "clones nested structures",
        args: [[1, [2, 3], { a: 4, b: { c: 5 } }]],
        expected: [1, [2, 3], { a: 4, b: { c: 5 } }],
      },
      {
        type: "script",
        name: "nested object is not the same reference",
        script: `
const input = { a: { b: 1 } };
const out = subject(input);
t.ok(out.a !== input.a, "nested object must be cloned, not shared");
t.equal(out, input);
`,
      },
      {
        type: "script",
        name: "nested array is not the same reference",
        script: `
const input = { list: [1, 2, { x: 1 }] };
const out = subject(input);
t.ok(out.list !== input.list, "nested array must be cloned, not shared");
t.ok(out.list[2] !== input.list[2], "objects inside arrays must be cloned too");
`,
      },
      {
        type: "script",
        name: "does not delegate to structuredClone",
        script: `
const original = globalThis.structuredClone;
let used = false;
globalThis.structuredClone = function (...args) {
  used = true;
  return original ? original.apply(this, args) : args[0];
};
try {
  subject({ a: { b: 1 } });
} finally {
  globalThis.structuredClone = original;
}
t.ok(!used, "rebuild it — don't delegate to structuredClone()");
`,
      },
    ],
  },
  parSeconds: 200, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 600,
  tags: ["recursion", "objects", "par-unverified"],
});
