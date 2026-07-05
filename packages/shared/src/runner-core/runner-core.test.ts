import { describe, expect, it } from "vitest";
import tsPkg from "typescript";
import type { JsWorkerTests, TsCheckTests } from "../challenge-schema.js";
import { deepEqual } from "./deep-equal.js";
import { createFakeClock } from "./fake-clock.js";
import { reviveFunctionArgs, runJsWorkerTests } from "./js-harness.js";
import { runTsCheck, type TsModule } from "./ts-check.js";

// typescript is CJS; the default import is the reliable runtime shape, cast
// to the namespace type the injected parameter expects.
const ts = tsPkg as unknown as TsModule;

describe("deepEqual", () => {
  it("handles primitives, NaN, nested structures, Map/Set/Date", () => {
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(deepEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true);
    expect(deepEqual(new Map([["k", 1]]), new Map([["k", 2]]))).toBe(false);
    expect(deepEqual(new Date(100), new Date(100))).toBe(true);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });
});

describe("createFakeClock", () => {
  it("fires timers in time order and supports clear", async () => {
    const clock = createFakeClock();
    const fired: string[] = [];
    clock.setTimeout(() => fired.push("b"), 200);
    clock.setTimeout(() => fired.push("a"), 100);
    const cancelled = clock.setTimeout(() => fired.push("never"), 150);
    clock.clearTimeout(cancelled);
    await clock.tick(250);
    expect(fired).toEqual(["a", "b"]);
    expect(clock.now()).toBe(250);
    expect(clock.pendingTimers()).toBe(0);
  });

  it("timers scheduled by fired timers run within the same tick", async () => {
    const clock = createFakeClock();
    const fired: number[] = [];
    clock.setTimeout(() => {
      fired.push(clock.now());
      clock.setTimeout(() => fired.push(clock.now()), 50);
    }, 100);
    await clock.tick(200);
    expect(fired).toEqual([100, 150]);
  });
});

describe("reviveFunctionArgs", () => {
  it("revives __FN__ strings, including nested ones", () => {
    const revived = reviveFunctionArgs([[1, 2], "__FN__:(n) => n * 2", { key: "__FN__:() => 7" }]) as [
      number[],
      (n: number) => number,
      { key: () => number },
    ];
    expect(revived[0]).toEqual([1, 2]);
    expect(revived[1](21)).toBe(42);
    expect(revived[2].key()).toBe(7);
  });
});

const flattenTests: JsWorkerTests = {
  schemaVersion: 1,
  kind: "js_worker",
  entryPoint: "flatten",
  needsFakeClock: false,
  cases: [
    { type: "call", name: "flattens one level", args: [[1, [2, 3]], 1], expected: [1, 2, 3] },
    {
      type: "call",
      name: "flattens deeply",
      args: [[1, [2, [3, [4]]]], Infinity],
      expected: [1, 2, 3, 4],
    },
  ],
};

describe("runJsWorkerTests", () => {
  it("passes a correct solution", async () => {
    const result = await runJsWorkerTests(
      `function flatten(arr, depth) { return arr.flat(depth); }`,
      flattenTests,
    );
    expect(result.status).toBe("passed");
    expect(result.casesPassed).toBe(2);
  });

  it("fails a wrong solution with a readable message naming expected vs received", async () => {
    const result = await runJsWorkerTests(
      `function flatten(arr) { return arr.flat(1); }`, // ignores depth
      flattenTests,
    );
    expect(result.status).toBe("failed");
    const failing = result.cases.find((c) => c.status === "fail");
    expect(failing?.name).toBe("flattens deeply");
    expect(failing?.message).toContain("expected [1,2,3,4]");
  });

  it("reports a missing entry point as a setup error", async () => {
    const result = await runJsWorkerTests(`const nope = 1;`, flattenTests);
    expect(result.status).toBe("error");
    expect(result.cases[0]?.message).toContain('"flatten"');
  });

  it("times out a never-resolving async case without hanging", async () => {
    const result = await runJsWorkerTests(`function flatten() { return new Promise(() => {}); }`, {
      ...flattenTests,
      cases: [{ type: "call", name: "hangs", args: [[1]], expected: [1], timeoutMs: 50 }],
    });
    expect(result.status).toBe("timeout");
    expect(result.cases[0]?.status).toBe("timeout");
  });

  it("runs a debounce challenge deterministically under the fake clock", async () => {
    const debounceTests: JsWorkerTests = {
      schemaVersion: 1,
      kind: "js_worker",
      entryPoint: "debounce",
      needsFakeClock: true,
      cases: [
        {
          type: "script",
          name: "runs once after the calls go quiet",
          script: `
            const fn = t.spy();
            const debounced = subject(fn, 200);
            debounced(1); await t.clock.tick(100);
            debounced(2); await t.clock.tick(100);
            debounced(3);
            t.equal(fn.callCount, 0, "must stay quiet while calls keep coming");
            await t.clock.tick(200);
            t.equal(fn.callCount, 1, "runs exactly once");
            t.equal(fn.calls[0], [3], "receives the latest arguments");
          `,
        },
      ],
    };
    const solution = `
      function debounce(fn, wait) {
        let timer = null;
        return function (...args) {
          clearTimeout(timer);
          timer = setTimeout(() => { timer = null; fn.apply(this, args); }, wait);
        };
      }
    `;
    for (let i = 0; i < 5; i++) {
      const result = await runJsWorkerTests(solution, debounceTests);
      expect(result.status).toBe("passed");
    }
  });

  it("isolates state between cases (fresh eval per case)", async () => {
    const result = await runJsWorkerTests(`let count = 0; function flatten() { return ++count; }`, {
      ...flattenTests,
      cases: [
        { type: "call", name: "first", args: [], expected: 1 },
        { type: "call", name: "second (fresh state)", args: [], expected: 1 },
      ],
    });
    expect(result.status).toBe("passed");
  });
});

describe("runTsCheck", () => {
  const pickTests: TsCheckTests = {
    schemaVersion: 1,
    kind: "ts_check",
    cases: [
      {
        name: "picks a single key",
        assertion: 'type _T1 = Expect<Equal<MyPick<{ a: 1; b: 2 }, "a">, { a: 1 }>>;',
      },
      {
        name: "picks multiple keys",
        assertion: 'type _T2 = Expect<Equal<MyPick<{ a: 1; b: 2; c: 3 }, "a" | "c">, { a: 1; c: 3 }>>;',
      },
    ],
  };

  it("passes a correct type solution", () => {
    const result = runTsCheck(ts, `type MyPick<T, K extends keyof T> = { [P in K]: T[P] };`, pickTests);
    expect(result.status).toBe("passed");
  });

  it("fails a wrong type solution, attributing diagnostics to the failing case", () => {
    const result = runTsCheck(ts, `type MyPick<T, K extends keyof T> = { [P in keyof T]: T[P] };`, pickTests);
    expect(result.status).toBe("failed");
    expect(result.cases.every((c) => c.status === "fail")).toBe(true);
    expect(result.cases[0]?.message).toBeTruthy();
  });

  it("reports user-code type errors with editor-relative lines", () => {
    const result = runTsCheck(ts, `type MyPick<T, K> = { [P in K]: T[P] };`, pickTests);
    expect(result.status).toBe("error");
    expect(result.cases[0]?.message).toContain("your code has type errors");
  });
});
