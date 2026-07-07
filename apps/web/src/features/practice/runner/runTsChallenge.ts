/**
 * Main-thread side of the ts_check runner (S4-2). Unlike the JS runner, the
 * worker stays ALIVE across runs — the compiler + lib fetches are the
 * expensive part (first run 2-5s, warm ≤800ms) and type-checking is pure, so
 * there's no cross-run state to fear. A generous first-run deadline covers
 * the lazy load; unresponsiveness kills and recycles the worker.
 */

import type { TsCheckTests } from "@codereps/shared";
import type { RunResult } from "@codereps/shared/runner-core";

const FIRST_RUN_KILL_MS = 30_000;
const WARM_KILL_MS = 10_000;

let worker: Worker | null = null;
let hasCompletedRun = false;
let runSeq = 0;

function getWorker(): Worker {
  worker ??= new Worker(new URL("./ts-check.worker.ts", import.meta.url), { type: "module" });
  return worker;
}

/** Optional pre-warm on challenge open — starts the compiler download early. */
export function warmTsChecker(): void {
  getWorker();
}

export function runTsChallenge(userCode: string, tests: TsCheckTests): Promise<RunResult> {
  const w = getWorker();
  const runId = ++runSeq;
  const killMs = hasCompletedRun ? WARM_KILL_MS : FIRST_RUN_KILL_MS;

  return new Promise<RunResult>((resolve) => {
    const finish = (result: RunResult, recycle = false): void => {
      clearTimeout(killer);
      w.removeEventListener("message", onMessage);
      if (recycle) {
        w.terminate();
        worker = null;
        hasCompletedRun = false;
      } else {
        hasCompletedRun = true;
      }
      resolve(result);
    };

    const killer = setTimeout(() => {
      finish(
        {
          status: "error",
          casesPassed: 0,
          casesTotal: tests.cases.length,
          cases: [],
          setupError: "type checker unresponsive — recycled; try again",
        },
        true,
      );
    }, killMs);

    const onMessage = (event: MessageEvent<{ runId: number; result: RunResult }>) => {
      if (event.data.runId !== runId) return;
      finish(event.data.result);
    };
    w.addEventListener("message", onMessage);
    w.postMessage({
      runId,
      userCode,
      tests,
      libBaseUrl: `${window.location.origin}/runners/ts-lib`,
    });
  });
}
