import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "debounce",
  title: "Debounce",
  category: "javascript",
  mode: "pattern_drill",
  difficulty: 3,
  runner: "js_worker",
  language: "javascript",
  promptMd: `Write a debounce utility from memory. It wraps a function and delays running it until the calls have been quiet for a set interval.

- Take \`fn\` and \`wait\` (ms); return a new debounced function.
- Each call resets the timer; \`fn\` runs once, \`wait\` ms after the last call.
- When \`fn\` finally runs it receives the **latest** arguments.
- Preserve \`this\` from the final call site.

Behaves like: called 5× within 100ms with \`wait = 200\` → \`fn\` runs once, 200ms after the last call.`,
  starterCode: `// implement from memory — no autocomplete, no paste
function debounce(fn, wait) {

}
`,
  solutionCode: `function debounce(fn, wait) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  };
}
`,
  solutionNotesMd:
    "The whole pattern is one move: every call clears the previous timer and schedules a new one. An arrow function inside `setTimeout` keeps the outer `this`/`args` in scope — using `function` there would lose them.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "debounce",
    needsFakeClock: true,
    cases: [
      {
        type: "script",
        name: "stays quiet while calls keep arriving",
        script: `
const fn = t.spy();
const debounced = subject(fn, 200);
debounced(); await t.clock.tick(100);
debounced(); await t.clock.tick(100);
debounced(); await t.clock.tick(150);
t.equal(fn.callCount, 0, "fn must not run while calls are < wait apart");
`,
      },
      {
        type: "script",
        name: "runs once after the calls go quiet",
        script: `
const fn = t.spy();
const debounced = subject(fn, 200);
debounced(); debounced(); debounced();
await t.clock.tick(200);
t.equal(fn.callCount, 1, "exactly one trailing invocation");
await t.clock.tick(1000);
t.equal(fn.callCount, 1, "and nothing after it");
`,
      },
      {
        type: "script",
        name: "passes the latest arguments",
        script: `
const fn = t.spy();
const debounced = subject(fn, 100);
debounced("first"); debounced("second"); debounced("third");
await t.clock.tick(100);
t.equal(fn.calls[0], ["third"]);
`,
      },
      {
        type: "script",
        name: "preserves this binding",
        script: `
let seen;
const obj = { debounced: subject(function () { seen = this; }, 50) };
obj.debounced();
await t.clock.tick(50);
t.ok(seen === obj, "fn must run with the call-site this");
`,
      },
      {
        type: "script",
        name: "can fire again after a quiet period",
        script: `
const fn = t.spy();
const debounced = subject(fn, 100);
debounced("a"); await t.clock.tick(100);
debounced("b"); await t.clock.tick(100);
t.equal(fn.callCount, 2);
t.equal(fn.calls[1], ["b"]);
`,
      },
    ],
  },
  parSeconds: 240, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 900,
  tags: ["closures", "timers", "par-unverified"],
});
