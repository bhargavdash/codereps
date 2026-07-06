/**
 * Main-thread side of the JS runner — board S2-5, architecture §6 step 5:
 * a fresh worker per run (no state leakage between runs), and the main
 * thread hard-kills it after 4s. That kill is what stops `while(true)` —
 * the worker's own per-case deadlines can't interrupt sync code.
 */

import type { JsWorkerTests } from "@codereps/shared";
import type { RunResult } from "@codereps/shared/runner-core";

export const HARD_KILL_MS = 4000;

let nextRunId = 1;

export function runJsChallenge(
  compiledCode: string,
  tests: JsWorkerTests,
  hardKillMs = HARD_KILL_MS,
): Promise<RunResult> {
  const worker = new Worker(new URL("./js-runner.worker.ts", import.meta.url), {
    type: "module",
  });
  const runId = nextRunId++;

  return new Promise<RunResult>((resolve) => {
    const finish = (result: RunResult): void => {
      clearTimeout(killer);
      worker.terminate();
      resolve(result);
    };

    const killer = setTimeout(() => {
      finish({
        status: "timeout",
        casesPassed: 0,
        casesTotal: tests.cases.length,
        cases: tests.cases.map((c) => ({
          name: c.name,
          status: "timeout" as const,
          ms: hardKillMs,
          message: "run exceeded the 4s limit — likely an infinite loop",
        })),
        setupError: "hard kill: run did not finish in time",
      });
    }, hardKillMs);

    worker.onmessage = (event: MessageEvent<{ runId: number; result: RunResult }>) => {
      if (event.data.runId !== runId) return;
      finish(event.data.result);
    };
    worker.onerror = (event) => {
      finish({
        status: "error",
        casesPassed: 0,
        casesTotal: tests.cases.length,
        cases: [],
        setupError: event.message || "worker crashed",
      });
    };

    worker.postMessage({ runId, compiledCode, tests });
  });
}
