/**
 * srcdoc harness for the react_iframe runner (S4-1, architecture §6).
 *
 * Sandbox posture: `sandbox="allow-scripts"` WITHOUT allow-same-origin →
 * opaque origin: no parent cookies/localStorage, no top navigation. The
 * harness binds its postMessage channel before any user code can run and
 * echoes the parent's nonce on every reply. Assertion utils are a deliberate
 * small duplication of runner-core (an opaque-origin document can't import
 * app modules).
 */

export function buildReactHarnessSrcdoc(runtimeUrl: string): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><script src="${runtimeUrl}"><\/script></head>
<body>
<script>
(() => {
  "use strict";
  const post = window.parent.postMessage.bind(window.parent);

  // ---- minimal assertion kit (mirrors runner-core semantics) ----
  const stringify = (v) => {
    if (typeof v === "function") return "[function]";
    if (v === undefined) return "undefined";
    try { const s = JSON.stringify(v); return s && s.length > 200 ? s.slice(0, 200) + "…" : s; }
    catch { return String(v); }
  };
  const deepEqual = (a, b) => {
    if (Object.is(a, b)) return true;
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
  };
  class CaseFailure extends Error {}
  const makeT = () => ({
    equal(actual, expected, label) {
      if (!deepEqual(actual, expected)) {
        throw new CaseFailure((label ? label + ": " : "") + "expected " + stringify(expected) + " but received " + stringify(actual));
      }
    },
    ok(value, label) { if (!value) throw new CaseFailure(label || "expected a truthy value"); },
    fail(label) { throw new CaseFailure(label); },
    spy(impl) {
      const fn = (...args) => { fn.calls.push(args); fn.callCount += 1; return impl ? impl(...args) : undefined; };
      fn.calls = []; fn.callCount = 0; return fn;
    },
  });

  // Off-screen cross-origin iframes get NO requestAnimationFrame and their
  // DOM timers are throttled to ~1Hz — MessageChannel tasks are exempt from
  // that policy, so all scheduling in here rides on them.
  const macrotask = () => new Promise((r) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => r();
    ch.port2.postMessage(0);
  });
  const settle = async () => { await macrotask(); await macrotask(); };
  const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;
  const now = () => performance.now();

  async function runCase(compiledCode, componentName, testCase, defaultTimeout) {
    const startedAt = now();
    const finish = (partial) => Object.assign(
      { name: testCase.name, ms: Math.max(0, Math.round(now() - startedAt)) }, partial);

    let Component;
    try {
      Component = new Function("React", "ReactDOM",
        '"use strict";\\n' + compiledCode + "\\n;return (typeof " + componentName + ' === "undefined" ? undefined : ' + componentName + ");",
      )(window.React, window.ReactDOM);
    } catch (err) {
      return finish({ status: "error", message: "code failed to evaluate: " + (err && err.message) });
    }
    if (typeof Component !== "function") {
      return finish({ status: "error", message: 'expected a component named "' + componentName + '" to be defined' });
    }

    const container = document.createElement("div");
    document.body.appendChild(container);
    let root = null;

    const exec = async () => {
      root = window.ReactDOM.createRoot(container);
      root.render(window.React.createElement(Component));
      await settle();
      const TL = window.TestingLibraryDom;
      const ctx = {
        container,
        React: window.React,
        ReactDOM: window.ReactDOM,
        dom: Object.assign({}, TL.within(container), { fireEvent: TL.fireEvent }),
        t: makeT(),
        tick: settle,
      };
      await new AsyncFn("ctx", '"use strict";\\n' + testCase.script)(ctx);
      return finish({ status: "pass" });
    };

    const limit = testCase.timeoutMs || defaultTimeout;
    // MessageChannel-hop deadline (setTimeout is throttled here); stops
    // spinning as soon as the case settles
    let caseSettled = false;
    const deadline = (async () => {
      const end = now() + limit;
      while (!caseSettled && now() < end) await macrotask();
      return "__timeout__";
    })();
    try {
      const outcome = await Promise.race([exec(), deadline]);
      if (outcome === "__timeout__") return finish({ status: "timeout", message: "case exceeded its deadline" });
      return outcome;
    } catch (err) {
      if (err instanceof CaseFailure) return finish({ status: "fail", message: err.message });
      return finish({ status: "error", message: "threw " + ((err && err.message) || String(err)) });
    } finally {
      caseSettled = true;
      try { if (root) root.unmount(); } catch {}
      container.remove();
    }
  }

  addEventListener("message", async (event) => {
    const d = event.data;
    if (!d || d.type !== "run") return;
    const cases = [];
    for (const testCase of d.tests.cases) {
      cases.push(await runCase(d.compiledCode, d.tests.componentName, testCase, 2000));
    }
    const passed = cases.filter((c) => c.status === "pass").length;
    const status = cases.some((c) => c.status === "timeout") ? "timeout"
      : cases.some((c) => c.status === "error") ? "error"
      : passed === cases.length ? "passed" : "failed";
    post({ type: "result", nonce: d.nonce, runId: d.runId,
      result: { status, casesPassed: passed, casesTotal: cases.length, cases } }, "*");
  });

  post({ type: "ready" }, "*");
})();
<\/script>
</body>
</html>`;
}
