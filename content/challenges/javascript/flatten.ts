import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "flatten",
  title: "Flatten",
  category: "javascript",
  mode: "syntax_sprint",
  difficulty: 2,
  runner: "js_worker",
  language: "javascript",
  promptMd: `Implement array flattening with a depth limit — \`Array.prototype.flat\`, rebuilt by hand (don't call \`flat\`).

- \`flatten(arr, depth)\` returns a **new** array with nested arrays spliced in-place up to \`depth\` levels.
- \`depth\` defaults to 1.
- Elements that aren't arrays pass through untouched.
- Never mutate the input.`,
  starterCode: `function flatten(arr, depth = 1) {

}
`,
  solutionCode: `function flatten(arr, depth = 1) {
  const out = [];
  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) {
      out.push(...flatten(item, depth - 1));
    } else {
      out.push(item);
    }
  }
  return out;
}
`,
  solutionNotesMd:
    "The recursion carries `depth - 1`, and the base case is simply `depth > 0` failing — no separate depth-0 branch needed. Spreading the recursive result (`push(...)`) is what splices children in flat.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "flatten",
    cases: [
      {
        type: "call",
        name: "flattens one level by default",
        args: [[1, [2, 3], [4, [5]]]],
        expected: [1, 2, 3, 4, [5]],
      },
      {
        type: "call",
        name: "respects an explicit depth",
        args: [[1, [2, [3, [4]]]], 2],
        expected: [1, 2, 3, [4]],
      },
      {
        type: "call",
        name: "depth 0 copies without flattening",
        args: [[1, [2]], 0],
        expected: [1, [2]],
      },
      {
        type: "call",
        name: "handles deep nesting",
        args: [[[1, [2, [3, [4, [5]]]]]], 99],
        expected: [1, 2, 3, 4, 5],
      },
      {
        type: "script",
        name: "does not mutate the input",
        script: `
const input = [1, [2, [3]]];
subject(input, 2);
t.equal(input, [1, [2, [3]]], "input must be untouched");
`,
      },
      {
        type: "script",
        name: "does not call Array.prototype.flat",
        script: `
const original = Array.prototype.flat;
let used = false;
Array.prototype.flat = function (...args) { used = true; return original.apply(this, args); };
try {
  subject([1, [2, [3]]], 5);
} finally {
  Array.prototype.flat = original;
}
t.ok(!used, "rebuild it — don't delegate to flat()");
`,
      },
    ],
  },
  parSeconds: 180, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 600,
  tags: ["recursion", "arrays", "par-unverified"],
});
