/**
 * js_worker execution harness — board S1-2 gotcha: this module IS the runner
 * logic. verify-content runs it directly in Node; the Sprint 2 Web Worker
 * wraps it with Blob-URL isolation + hard kill. Keep it environment-agnostic:
 * no Node or DOM APIs beyond structuredClone/performance (both universal).
 *
 * Enforcement notes (architecture §6):
 * - Each case re-evaluates the user code → fresh closure state + fresh fake
 *   clock per case; nothing leaks between cases.
 * - Inputs are structuredClone'd before the call so user mutation can't
 *   corrupt later comparisons.
 * - Per-case deadline via Promise.race. In-process sync infinite loops are
 *   NOT interruptible here — the browser worker's terminate() covers that;
 *   in Node CI it means a hung run, which is acceptable for our own content.
 */

import type { JsWorkerCase, JsWorkerTests } from "../challenge-schema.js";
import { deepEqual, stringify } from "./deep-equal.js";
import { createFakeClock, type FakeClock } from "./fake-clock.js";
import { summarizeCases, type CaseResult, type RunResult } from "./types.js";

export const DEFAULT_CASE_TIMEOUT_MS = 1000;

/**
 * Host globals typed locally — this package compiles without DOM or Node lib
 * types on purpose (it runs in both), so the environment surface it relies on
 * is declared explicitly here.
 */
const host = globalThis as unknown as {
  setTimeout(fn: () => void, ms?: number): unknown;
  clearTimeout(handle: unknown): void;
  structuredClone?<T>(value: T): T;
  performance?: { now(): number };
};

/** Marker for function-valued args stored in jsonb (see challenge-schema). */
const FN_PREFIX = "__FN__:";

class CaseFailure extends Error {
  constructor(
    message: string,
    readonly expected?: unknown,
    readonly received?: unknown,
  ) {
    super(message);
    this.name = "CaseFailure";
  }
}

/** Recursively revive "__FN__:<source>" strings into functions. */
export function reviveFunctionArgs(value: unknown): unknown {
  if (typeof value === "string" && value.startsWith(FN_PREFIX)) {
    return new Function(`"use strict"; return (${value.slice(FN_PREFIX.length)});`)();
  }
  if (Array.isArray(value)) return value.map(reviveFunctionArgs);
  if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, reviveFunctionArgs(v)]),
    );
  }
  return value;
}

/** Call/spy recorder handed to script cases via `t.spy()`. */
export interface Spy {
  (...args: unknown[]): unknown;
  calls: unknown[][];
  callCount: number;
}

/** Assertion toolkit available inside script cases as `t`. */
export interface TestUtils {
  equal(actual: unknown, expected: unknown, label?: string): void;
  ok(value: unknown, label?: string): void;
  fail(label: string): never;
  spy(impl?: (...args: unknown[]) => unknown): Spy;
  /** Present only when the challenge sets needsFakeClock. */
  clock?: FakeClock;
}

function makeTestUtils(clock: FakeClock | undefined): TestUtils {
  return {
    equal(actual, expected, label) {
      if (!deepEqual(actual, expected)) {
        throw new CaseFailure(
          `${label ? `${label}: ` : ""}expected ${stringify(expected)} but received ${stringify(actual)}`,
          expected,
          actual,
        );
      }
    },
    ok(value, label) {
      if (!value) {
        throw new CaseFailure(`${label ?? "expected a truthy value"} (received ${stringify(value)})`);
      }
    },
    fail(label) {
      throw new CaseFailure(label);
    },
    spy(impl) {
      const spy = ((...args: unknown[]) => {
        spy.calls.push(args);
        spy.callCount += 1;
        return impl?.(...args);
      }) as Spy;
      spy.calls = [];
      spy.callCount = 0;
      return spy;
    },
    clock,
  };
}

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
  ...args: string[]
) => (...fnArgs: unknown[]) => Promise<unknown>;

const CLOCK_PARAMS = ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"];

/**
 * Evaluate user code and pluck the entry point. Under a fake clock the timer
 * globals are shadowed as function parameters, so only the user's code sees
 * fake time — the harness keeps the real clock.
 */
function buildSubject(code: string, entryPoint: string, clock: FakeClock | undefined): unknown {
  const body = `"use strict";\n${code}\n;return (typeof ${entryPoint} === "undefined" ? undefined : ${entryPoint});`;
  if (clock) {
    const factory = new Function(...CLOCK_PARAMS, body);
    return factory(clock.setTimeout, clock.clearTimeout, clock.setInterval, clock.clearInterval, clock.DateCtor);
  }
  return new Function(body)();
}

function timeoutSentinel(ms: number): { promise: Promise<typeof TIMED_OUT>; cancel: () => void } {
  let handle: unknown;
  const promise = new Promise<typeof TIMED_OUT>((resolve) => {
    handle = host.setTimeout(() => resolve(TIMED_OUT), ms);
  });
  return { promise, cancel: () => host.clearTimeout(handle) };
}
const TIMED_OUT = Symbol("timed out");

async function runCase(
  compiledCode: string,
  tests: JsWorkerTests,
  testCase: JsWorkerCase,
): Promise<CaseResult> {
  const clockNow = () => host.performance?.now() ?? Date.now();
  const startedAt = clockNow();
  const finish = (partial: Omit<CaseResult, "name" | "ms">): CaseResult => ({
    name: testCase.name,
    ms: Math.max(0, Math.round(clockNow() - startedAt)),
    ...partial,
  });

  const clock = tests.needsFakeClock ? createFakeClock() : undefined;

  let subject: unknown;
  try {
    subject = buildSubject(compiledCode, tests.entryPoint, clock);
  } catch (err) {
    return finish({ status: "error", message: `code failed to evaluate: ${(err as Error).message}` });
  }
  if (typeof subject !== "function") {
    return finish({
      status: "error",
      message: `expected a function named "${tests.entryPoint}" to be defined`,
    });
  }

  const exec = async (): Promise<CaseResult> => {
    if (testCase.type === "call") {
      const clone = host.structuredClone ?? (<T>(v: T): T => JSON.parse(JSON.stringify(v)) as T);
      const args = reviveFunctionArgs(clone(testCase.args)) as unknown[];
      const received: unknown = await (subject as (...a: unknown[]) => unknown)(...args);
      if (deepEqual(received, testCase.expected)) return finish({ status: "pass" });
      return finish({
        status: "fail",
        message: `expected ${stringify(testCase.expected)} but received ${stringify(received)}`,
        expected: testCase.expected,
        received,
      });
    }
    const t = makeTestUtils(clock);
    const scriptFn = new AsyncFunction("subject", "t", `"use strict";\n${testCase.script}`);
    await scriptFn(subject, t);
    return finish({ status: "pass" });
  };

  const deadline = timeoutSentinel(testCase.timeoutMs ?? DEFAULT_CASE_TIMEOUT_MS);
  try {
    const outcome = await Promise.race([exec(), deadline.promise]);
    if (outcome === TIMED_OUT) {
      return finish({ status: "timeout", message: "case exceeded its deadline" });
    }
    return outcome;
  } catch (err) {
    if (err instanceof CaseFailure) {
      return finish({
        status: "fail",
        message: err.message,
        expected: err.expected,
        received: err.received,
      });
    }
    return finish({ status: "error", message: `threw ${(err as Error)?.message ?? String(err)}` });
  } finally {
    deadline.cancel();
  }
}

/**
 * Run every case of a js_worker challenge against `compiledCode` (plain JS —
 * TS/JSX must already be stripped by the caller: Sucrase in the browser,
 * ts.transpileModule in verify-content).
 */
export async function runJsWorkerTests(
  compiledCode: string,
  tests: JsWorkerTests,
): Promise<RunResult> {
  const cases: CaseResult[] = [];
  for (const testCase of tests.cases) {
    cases.push(await runCase(compiledCode, tests, testCase));
  }
  return summarizeCases(cases);
}
