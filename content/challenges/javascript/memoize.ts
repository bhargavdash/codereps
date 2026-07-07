import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "memoize",
  title: "Memoize",
  category: "javascript",
  mode: "pattern_drill",
  difficulty: 2,
  runner: "js_worker",
  language: "javascript",
  promptMd: `Cache a pure function's results — the closure-over-a-Map rep.

- \`memoize(fn)\` returns a function with the same behavior that computes each distinct argument list **once**.
- Key by the full argument list (\`JSON.stringify\` of the args is fine).
- Cached results must be returned without calling \`fn\` again — including cached \`undefined\`/falsy results.`,
  starterCode: `function memoize(fn) {

}
`,
  solutionCode: `function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (!cache.has(key)) {
      cache.set(key, fn.apply(this, args));
    }
    return cache.get(key);
  };
}
`,
  solutionNotesMd:
    "`cache.has(key)` — not `cache.get(key) !== undefined` — is what makes cached falsy values work. That distinction (presence vs value) is the bug interviewers plant.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "memoize",
    cases: [
      {
        type: "script",
        name: "computes once per distinct input",
        script: `
const fn = t.spy((n) => n * 2);
const memo = subject(fn);
t.equal(memo(21), 42);
t.equal(memo(21), 42);
t.equal(memo(21), 42);
t.equal(fn.callCount, 1, "same args must hit the cache");`,
      },
      {
        type: "script",
        name: "different args compute separately",
        script: `
const fn = t.spy((a, b) => a + b);
const memo = subject(fn);
t.equal(memo(1, 2), 3);
t.equal(memo(2, 1), 3);
t.equal(fn.callCount, 2, "(1,2) and (2,1) are different keys");`,
      },
      {
        type: "script",
        name: "caches falsy results too",
        script: `
const fn = t.spy(() => undefined);
const memo = subject(fn);
memo();
memo();
t.equal(fn.callCount, 1, "cached undefined must not recompute");`,
      },
      {
        type: "script",
        name: "keys by the whole argument list",
        script: `
const fn = t.spy((...args) => args.length);
const memo = subject(fn);
t.equal(memo(1), 1);
t.equal(memo(1, 1), 2);
t.equal(fn.callCount, 2);`,
      },
    ],
  },
  parSeconds: 210, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 900,
  tags: ["closures", "caching", "par-unverified"],
});
