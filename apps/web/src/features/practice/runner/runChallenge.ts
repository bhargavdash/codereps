/**
 * Runner dispatch (S4): one entry point per rep, routed by tests.kind.
 * Compilation happens here (Sucrase, S2-4) for the runners that execute JS;
 * ts_check hands raw TypeScript to the compiler untouched.
 */

import type { ChallengeDetail } from "@codereps/shared";
import type { RunResult } from "@codereps/shared/runner-core";
import { compileForRun } from "../../../lib/compile";
import { runJsChallenge } from "./runJsChallenge";
import { runTsChallenge } from "./runTsChallenge";
import { runCssChallenge } from "./cssIframeRunner";
import type { ReactIframeRunner } from "./ReactIframeRunner";

export type RunOutcome =
  | { ok: true; result: RunResult }
  | { ok: false; compileError: string };

export interface RunnerContext {
  /** Pre-warmed by the practice screen when the challenge is react_iframe. */
  react?: ReactIframeRunner;
}

export async function runChallenge(
  code: string,
  detail: ChallengeDetail,
  ctx: RunnerContext = {},
): Promise<RunOutcome> {
  switch (detail.tests.kind) {
    case "js_worker": {
      const compiled = compileForRun(code, detail.language);
      if (!compiled.ok) return { ok: false, compileError: compiled.message };
      return { ok: true, result: await runJsChallenge(compiled.code, detail.tests) };
    }
    case "react_iframe": {
      const compiled = compileForRun(code, detail.language);
      if (!compiled.ok) return { ok: false, compileError: compiled.message };
      if (!ctx.react) {
        return {
          ok: true,
          result: {
            status: "error",
            casesPassed: 0,
            casesTotal: detail.tests.cases.length,
            cases: [],
            setupError: "react runner not initialized",
          },
        };
      }
      return { ok: true, result: await ctx.react.run(compiled.code, detail.tests) };
    }
    case "ts_check":
      return { ok: true, result: await runTsChallenge(code, detail.tests) };
    case "css_iframe":
      return { ok: true, result: await runCssChallenge(code, detail.tests) };
  }
}
