import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "group-by",
  title: "groupBy",
  category: "javascript",
  mode: "syntax_sprint",
  difficulty: 2,
  runner: "js_worker",
  language: "javascript",
  promptMd: `Implement \`groupBy\` — bucket a list into a plain object keyed by what a callback returns for each item.

- \`groupBy(items, keyFn)\` returns an object mapping each key to an **array** of the items that produced it.
- \`keyFn\` receives the item and returns the group key (string or number).
- Items keep their original relative order inside each group.
- An empty input produces an empty object.`,
  starterCode: `function groupBy(items, keyFn) {

}
`,
  solutionCode: `function groupBy(items, keyFn) {
  const out = {};
  for (const item of items) {
    const key = keyFn(item);
    (out[key] ??= []).push(item);
  }
  return out;
}
`,
  solutionNotesMd:
    "The `??=` (nullish-assign) idiom creates the bucket on first sight and reuses it after — one line instead of the `if (!out[key]) out[key] = []` dance.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "groupBy",
    cases: [
      {
        type: "call",
        name: "groups numbers by parity",
        args: [[1, 2, 3, 4, 5], "__FN__:(n) => (n % 2 === 0 ? 'even' : 'odd')"],
        expected: { odd: [1, 3, 5], even: [2, 4] },
      },
      {
        type: "call",
        name: "groups words by length, preserving order",
        args: [["hi", "sun", "go", "map"], "__FN__:(w) => w.length"],
        expected: { 2: ["hi", "go"], 3: ["sun", "map"] },
      },
      {
        type: "call",
        name: "empty input gives an empty object",
        args: [[], "__FN__:(x) => x"],
        expected: {},
      },
      {
        type: "script",
        name: "calls keyFn exactly once per item",
        script: `
const keyFn = t.spy(() => "k");
subject([10, 20, 30], keyFn);
t.equal(keyFn.callCount, 3);
t.equal(keyFn.calls.map((c) => c[0]), [10, 20, 30]);
`,
      },
    ],
  },
  parSeconds: 150, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 600,
  tags: ["objects", "iteration", "par-unverified"],
});
