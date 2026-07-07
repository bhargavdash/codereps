/**
 * css_iframe runner (S4-3, architecture §6): render the challenge markup +
 * the user's CSS in a sandboxed iframe, assert getComputedStyle values per
 * case. viewportWidth is honored by the PARENT resizing the iframe between
 * cases (media queries respond to the iframe's own viewport), so cases run
 * one message at a time.
 */

import type { CssIframeTests } from "@codereps/shared";
import { summarizeCases, type CaseResult, type RunResult } from "@codereps/shared/runner-core";

const CASE_KILL_MS = 3000;
const DEFAULT_WIDTH = 800;

export function buildCssHarnessSrcdoc(markup: string, userCss: string): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8">
<style id="__user_css__">${userCss.replaceAll("</", "<\\/")}</style>
</head>
<body>
${markup}
<script>
(() => {
  "use strict";
  const post = window.parent.postMessage.bind(window.parent);
  // NOTE: no rAF/setTimeout here — both are throttled/suspended in
  // off-screen cross-origin iframes. getComputedStyle forces a synchronous
  // style+layout flush itself; one MessageChannel hop lets the just-resized
  // viewport propagate.
  const macrotask = () => new Promise((r) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => r();
    ch.port2.postMessage(0);
  });
  addEventListener("message", async (event) => {
    const d = event.data;
    if (!d || d.type !== "case") return;
    await macrotask();
    const failures = [];
    for (const a of d.assertions) {
      const el = document.querySelector(a.selector);
      if (!el) { failures.push(a.selector + ": no element matches"); continue; }
      const actual = getComputedStyle(el).getPropertyValue(a.property).trim();
      if (actual !== a.expected.trim()) {
        failures.push(a.selector + " { " + a.property + " } expected \\"" + a.expected + "\\" but computed \\"" + actual + "\\"");
      }
    }
    post({ type: "caseResult", nonce: d.nonce, seq: d.seq, failures }, "*");
  });
  post({ type: "ready" }, "*");
})();
<\/script>
</body>
</html>`;
}

export async function runCssChallenge(userCss: string, tests: CssIframeTests): Promise<RunResult> {
  const nonce = crypto.randomUUID();
  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = `position:fixed;left:-12000px;top:0;width:${DEFAULT_WIDTH}px;height:600px;visibility:hidden;border:0`;
  iframe.srcdoc = buildCssHarnessSrcdoc(tests.markup, userCss);
  document.body.appendChild(iframe);

  const waitFor = <T>(match: (d: Record<string, unknown>) => T | undefined, killMs: number): Promise<T | "__timeout__"> =>
    new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        window.removeEventListener("message", onMessage);
        resolve("__timeout__");
      }, killMs);
      const onMessage = (event: MessageEvent) => {
        if (event.source !== iframe.contentWindow) return;
        const matched = match(event.data as Record<string, unknown>);
        if (matched === undefined) return;
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        resolve(matched);
      };
      window.addEventListener("message", onMessage);
    });

  try {
    const ready = await waitFor((d) => (d?.type === "ready" ? true : undefined), CASE_KILL_MS);
    if (ready === "__timeout__") {
      return {
        status: "error",
        casesPassed: 0,
        casesTotal: tests.cases.length,
        cases: [],
        setupError: "css runner iframe failed to boot",
      };
    }

    const cases: CaseResult[] = [];
    for (let seq = 0; seq < tests.cases.length; seq++) {
      const testCase = tests.cases[seq]!;
      const t0 = performance.now();
      iframe.style.width = `${testCase.viewportWidth ?? DEFAULT_WIDTH}px`;

      const reply = waitFor(
        (d) =>
          d?.type === "caseResult" && d.nonce === nonce && d.seq === seq
            ? (d.failures as string[])
            : undefined,
        CASE_KILL_MS,
      );
      iframe.contentWindow?.postMessage(
        { type: "case", nonce, seq, assertions: testCase.assertions },
        "*",
      );
      const failures = await reply;
      const ms = Math.round(performance.now() - t0);

      if (failures === "__timeout__") {
        cases.push({ name: testCase.name, status: "timeout", ms, message: "case exceeded its deadline" });
      } else if (failures.length > 0) {
        cases.push({ name: testCase.name, status: "fail", ms, message: failures.join("; ") });
      } else {
        cases.push({ name: testCase.name, status: "pass", ms });
      }
    }
    return summarizeCases(cases);
  } finally {
    iframe.remove();
  }
}
