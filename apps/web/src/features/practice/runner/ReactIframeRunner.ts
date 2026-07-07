/**
 * Parent side of the react_iframe runner (S4-1). One iframe per run —
 * destroyed and re-warmed after each run so nothing leaks between reps —
 * with pre-warming on challenge open so a warm run stays <300ms.
 *
 * The iframe is rendered off-screen (NOT display:none) so layout and
 * getComputedStyle behave; sandbox="allow-scripts" only → opaque origin.
 */

import type { ReactIframeTests } from "@codereps/shared";
import { summarizeCases, type CaseResult, type RunResult } from "@codereps/shared/runner-core";
import { buildReactHarnessSrcdoc } from "./react-iframe-harness";

const READY_TIMEOUT_MS = 5000;

export class ReactIframeRunner {
  private iframe: HTMLIFrameElement | null = null;
  private readyPromise: Promise<void> | null = null;
  private nonce = "";
  private runSeq = 0;

  constructor(private readonly hardKillMs = 10_000) {}

  /** Create the sandboxed iframe ahead of time — call on challenge open. */
  warm(): void {
    if (this.iframe) return;
    this.nonce = crypto.randomUUID();
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText =
      "position:fixed;left:-12000px;top:0;width:800px;height:600px;visibility:hidden;border:0";
    iframe.srcdoc = buildReactHarnessSrcdoc(`${window.location.origin}/runners/react-runtime.js`);

    this.readyPromise = new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error("react runner failed to boot (is /runners/react-runtime.js built?)"));
      }, READY_TIMEOUT_MS);
      const onMessage = (event: MessageEvent) => {
        if (event.source !== iframe.contentWindow) return;
        if ((event.data as { type?: string })?.type !== "ready") return;
        cleanup();
        resolve();
      };
      const cleanup = () => {
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
      };
      window.addEventListener("message", onMessage);
    });

    document.body.appendChild(iframe);
    this.iframe = iframe;
  }

  destroy(): void {
    this.iframe?.remove();
    this.iframe = null;
    this.readyPromise = null;
  }

  async run(compiledCode: string, tests: ReactIframeTests): Promise<RunResult> {
    this.warm();
    const iframe = this.iframe!;
    const nonce = this.nonce;
    const runId = ++this.runSeq;

    const timeoutResult = (): RunResult => {
      const cases: CaseResult[] = tests.cases.map((c) => ({
        name: c.name,
        status: "timeout",
        ms: this.hardKillMs,
        message: "run exceeded the hard limit",
      }));
      return { ...summarizeCases(cases), setupError: "hard kill: iframe did not finish in time" };
    };

    try {
      await this.readyPromise;
    } catch (err) {
      this.destroy();
      return {
        status: "error",
        casesPassed: 0,
        casesTotal: tests.cases.length,
        cases: [],
        setupError: (err as Error).message,
      };
    }

    return new Promise<RunResult>((resolve) => {
      const finish = (result: RunResult) => {
        window.clearTimeout(killer);
        window.removeEventListener("message", onMessage);
        // fresh iframe per run: destroy the used one, pre-warm the next
        this.destroy();
        this.warm();
        resolve(result);
      };
      const killer = window.setTimeout(() => finish(timeoutResult()), this.hardKillMs);
      const onMessage = (event: MessageEvent) => {
        if (event.source !== iframe.contentWindow) return;
        const d = event.data as { type?: string; nonce?: string; runId?: number; result?: RunResult };
        if (d?.type !== "result" || d.nonce !== nonce || d.runId !== runId) return;
        if (!d.result || !Array.isArray(d.result.cases)) return; // shape check
        finish(d.result);
      };
      window.addEventListener("message", onMessage);
      iframe.contentWindow?.postMessage({ type: "run", nonce, runId, compiledCode, tests }, "*");
    });
  }
}
