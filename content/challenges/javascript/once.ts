import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "once",
  title: "Once",
  category: "javascript",
  mode: "syntax_sprint",
  difficulty: 1,
  runner: "js_worker",
  language: "javascript",
  promptMd: `The smallest useful closure — a function that only fires once.

- \`once(fn)\` returns a wrapped function that calls \`fn\` on the **first** invocation only.
- Every later call returns the cached result of that first call, without calling \`fn\` again.
- Arguments passed on the first call are the ones \`fn\` receives.`,
  starterCode: `function once(fn) {

}
`,
  solutionCode: `function once(fn) {
  let called = false;
  let result;
  return (...args) => {
    if (!called) {
      result = fn(...args);
      called = true;
    }
    return result;
  };
}
`,
  solutionNotesMd:
    "Two closure variables, not one: a boolean flag AND a cached result. Caching only the result (without a flag) breaks the moment `fn` can legitimately return `undefined`.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "once",
    cases: [
      {
        type: "script",
        name: "calls the wrapped function only once",
        script: `
let calls = 0;
const inc = () => { calls += 1; return calls; };
const wrapped = subject(inc);
wrapped();
wrapped();
wrapped();
t.equal(calls, 1, "fn must run exactly once");
`,
      },
      {
        type: "script",
        name: "returns the first result on every later call",
        script: `
let n = 0;
const wrapped = subject(() => { n += 1; return n; });
const first = wrapped();
t.equal(wrapped(), first);
t.equal(wrapped(), first);
`,
      },
      {
        type: "script",
        name: "forwards arguments from the first call",
        script: `
let received;
const wrapped = subject((...args) => { received = args; return args.length; });
wrapped(1, 2, 3);
wrapped(9, 9);
t.equal(received, [1, 2, 3]);
`,
      },
    ],
  },
  parSeconds: 90, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 300,
  tags: ["closures", "memoization", "par-unverified"],
});
