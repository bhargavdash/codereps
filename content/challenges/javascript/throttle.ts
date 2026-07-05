import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "throttle",
  title: "Throttle",
  category: "javascript",
  mode: "pattern_drill",
  difficulty: 4,
  runner: "js_worker",
  language: "javascript",
  promptMd: `Write a throttle utility from memory: it guarantees a wrapped function runs at most once per interval, without dropping the final call.

- Take \`fn\` and \`wait\` (ms); return a throttled function.
- **Leading edge:** the first call runs \`fn\` immediately.
- Calls during the cooldown don't run \`fn\`, but the **latest** of them must run when the cooldown ends (trailing edge, with its arguments).
- After a full quiet interval, the next call is a fresh leading call.

Behaves like: scroll events every 20ms with \`wait = 100\` → \`fn\` fires at 0ms, 100ms, 200ms… and once more with the last event.`,
  starterCode: `// leading + trailing throttle
function throttle(fn, wait) {

}
`,
  solutionCode: `function throttle(fn, wait) {
  let lastRun = -Infinity;
  let timer = null;
  let pendingArgs = null;

  return function (...args) {
    const now = Date.now();
    const remaining = wait - (now - lastRun);

    if (remaining <= 0) {
      lastRun = now;
      fn.apply(this, args);
      return;
    }

    pendingArgs = args;
    if (timer === null) {
      timer = setTimeout(() => {
        timer = null;
        lastRun = Date.now();
        fn.apply(this, pendingArgs);
        pendingArgs = null;
      }, remaining);
    }
  };
}
`,
  solutionNotesMd:
    "Two cooperating mechanisms: a timestamp (`lastRun`) decides whether a call may run immediately, and a single trailing timer holds the newest suppressed arguments. The classic bug is scheduling one timer per suppressed call — guard with `if (timer === null)`.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "throttle",
    needsFakeClock: true,
    cases: [
      {
        type: "script",
        name: "first call runs immediately",
        script: `
const fn = t.spy();
const throttled = subject(fn, 100);
throttled("a");
t.equal(fn.callCount, 1, "leading call must be synchronous");
t.equal(fn.calls[0], ["a"]);
`,
      },
      {
        type: "script",
        name: "suppresses calls inside the cooldown",
        script: `
const fn = t.spy();
const throttled = subject(fn, 100);
throttled("a");
await t.clock.tick(30); throttled("b");
await t.clock.tick(30); throttled("c");
t.equal(fn.callCount, 1, "b and c land inside the 100ms window");
`,
      },
      {
        type: "script",
        name: "trailing call fires with the latest arguments",
        script: `
const fn = t.spy();
const throttled = subject(fn, 100);
throttled("a");
await t.clock.tick(30); throttled("b");
await t.clock.tick(30); throttled("c");
await t.clock.tick(40); // 100ms since the leading call
t.equal(fn.callCount, 2, "the suppressed burst must produce one trailing run");
t.equal(fn.calls[1], ["c"], "with the newest arguments");
`,
      },
      {
        type: "script",
        name: "rate stays at one run per interval under a steady stream",
        script: `
const fn = t.spy();
const throttled = subject(fn, 100);
for (let ms = 0; ms <= 200; ms += 20) {
  throttled(ms);
  await t.clock.tick(20);
}
await t.clock.tick(100);
t.ok(fn.callCount >= 3 && fn.callCount <= 4, "≈220ms of 20ms events at wait=100 → 3-4 runs, saw " + fn.callCount);
`,
      },
      {
        type: "script",
        name: "a call after a quiet period is a fresh leading call",
        script: `
const fn = t.spy();
const throttled = subject(fn, 100);
throttled("a");
await t.clock.tick(300);
throttled("z");
t.equal(fn.callCount, 2, "quiet period over → run immediately");
t.equal(fn.calls[1], ["z"]);
`,
      },
    ],
  },
  parSeconds: 330, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 1200,
  tags: ["closures", "timers", "par-unverified"],
});
