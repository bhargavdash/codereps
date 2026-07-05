import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "promise-all",
  title: "Reimplement Promise.all",
  category: "javascript",
  mode: "pattern_drill",
  difficulty: 3,
  runner: "js_worker",
  language: "javascript",
  promptMd: `Rebuild \`Promise.all\` from memory as \`promiseAll(values)\` — without calling \`Promise.all\` itself.

- Resolve with an array of results **in input order**, regardless of which promise settles first.
- Accept non-promise values mixed in; they pass through to their position.
- Reject as soon as **any** input rejects, with that rejection reason.
- An empty array resolves immediately with \`[]\`.`,
  starterCode: `function promiseAll(values) {

}
`,
  solutionCode: `function promiseAll(values) {
  return new Promise((resolve, reject) => {
    const results = new Array(values.length);
    let remaining = values.length;
    if (remaining === 0) {
      resolve([]);
      return;
    }
    values.forEach((value, index) => {
      Promise.resolve(value).then((result) => {
        results[index] = result;
        remaining -= 1;
        if (remaining === 0) resolve(results);
      }, reject);
    });
  });
}
`,
  solutionNotesMd:
    "Order comes from writing into `results[index]`, not from push order. Completion is a countdown, not `results.length` (sparse arrays lie about length). `Promise.resolve(value)` is what makes plain values work for free.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "promiseAll",
    cases: [
      {
        type: "script",
        name: "resolves in input order even when timing is reversed",
        script: `
const slow = new Promise((res) => setTimeout(() => res("slow"), 30));
const fast = Promise.resolve("fast");
const result = await subject([slow, fast]);
t.equal(result, ["slow", "fast"], "positions follow the input, not settle order");
`,
      },
      {
        type: "script",
        name: "passes non-promise values through",
        script: `
const result = await subject([1, Promise.resolve(2), "three"]);
t.equal(result, [1, 2, "three"]);
`,
      },
      {
        type: "script",
        name: "rejects with the first rejection reason",
        script: `
const boom = new Promise((_res, rej) => setTimeout(() => rej(new Error("boom")), 10));
const slow = new Promise((res) => setTimeout(() => res("late"), 50));
try {
  await subject([slow, boom]);
  t.fail("must reject when any input rejects");
} catch (err) {
  t.equal(err.message, "boom");
}
`,
      },
      {
        type: "script",
        name: "empty array resolves to an empty array",
        script: `
const result = await subject([]);
t.equal(result, []);
`,
      },
      {
        type: "script",
        name: "does not call Promise.all",
        script: `
const original = Promise.all;
let used = false;
Promise.all = function (...args) { used = true; return original.apply(Promise, args); };
try {
  await subject([Promise.resolve(1), 2]);
} finally {
  Promise.all = original;
}
t.ok(!used, "rebuild it — don't delegate to Promise.all");
`,
      },
    ],
  },
  parSeconds: 300, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 1200,
  tags: ["promises", "async", "par-unverified"],
});
