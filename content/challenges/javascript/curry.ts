import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "curry",
  title: "Curry",
  category: "javascript",
  mode: "pattern_drill",
  difficulty: 3,
  runner: "js_worker",
  language: "javascript",
  promptMd: `Turn a multi-arg function into a chain of single-or-grouped-arg calls.

- \`curry(fn)\` returns a curried version of \`fn\`.
- The curried function keeps collecting arguments — one at a time or in groups — until it has received at least \`fn.length\` arguments, then calls \`fn\` with all of them and returns the result.
- Each partial application is reusable independently (calling it again with different args doesn't corrupt earlier partials).`,
  starterCode: `function curry(fn) {

}
`,
  solutionCode: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn(...args);
    }
    return (...more) => curried(...args, ...more);
  };
}
`,
  solutionNotesMd:
    "The base case is arity, not argument count of a single call — `args.length >= fn.length` lets `curried(1,2)(3)` and `curried(1)(2,3)` both terminate correctly. Returning a fresh closure per partial (rather than mutating a shared array) is what makes each partial independently reusable.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "curry",
    cases: [
      {
        type: "script",
        name: "curries three args one at a time",
        script: `
const add3 = (a, b, c) => a + b + c;
const curried = subject(add3);
t.equal(curried(1)(2)(3), 6);
`,
      },
      {
        type: "script",
        name: "accepts grouped arguments",
        script: `
const add3 = (a, b, c) => a + b + c;
const curried = subject(add3);
t.equal(curried(1, 2)(3), 6);
t.equal(curried(1)(2, 3), 6);
`,
      },
      {
        type: "script",
        name: "accepts all args at once",
        script: `
const add3 = (a, b, c) => a + b + c;
const curried = subject(add3);
t.equal(curried(1, 2, 3), 6);
`,
      },
      {
        type: "script",
        name: "each partial is independently reusable",
        script: `
const add3 = (a, b, c) => a + b + c;
const curried = subject(add3);
const addFrom1 = curried(1);
t.equal(addFrom1(2, 3), 6);
t.equal(addFrom1(5, 5), 11);
`,
      },
    ],
  },
  parSeconds: 240, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 900,
  tags: ["closures", "higher-order-functions", "par-unverified"],
});
