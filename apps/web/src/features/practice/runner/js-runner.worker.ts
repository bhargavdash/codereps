/**
 * js_worker runner worker — board S2-5. The harness is runner-core (shared
 * with verify-content, per the S1-2 gotcha); this file is only the worker
 * shell around it. User code arrives pre-compiled (Sucrase, S2-4).
 *
 * postMessage is captured before any user code can run, so a clobbered
 * global can't forge results (architecture §6).
 */

import { runJsWorkerTests } from "@codereps/shared/runner-core";
import type { JsWorkerTests } from "@codereps/shared";

export interface RunRequest {
  runId: number;
  compiledCode: string;
  tests: JsWorkerTests;
}

const post = self.postMessage.bind(self);

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  const { runId, compiledCode, tests } = event.data;
  const result = await runJsWorkerTests(compiledCode, tests);
  post({ runId, result });
};
