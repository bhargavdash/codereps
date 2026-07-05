/**
 * Result shapes shared by every runner (browser workers, iframes, and the
 * Node-side verify-content harness). The debrief UI renders `cases` as the
 * splits list, so names and per-case ms matter.
 */

export type CaseStatus = "pass" | "fail" | "timeout" | "error";

export interface CaseResult {
  name: string;
  status: CaseStatus;
  ms: number;
  /** Human-readable failure detail — shown in the splits list. */
  message?: string;
  expected?: unknown;
  received?: unknown;
}

export type RunStatus = "passed" | "failed" | "error" | "timeout";

export interface RunResult {
  status: RunStatus;
  casesPassed: number;
  casesTotal: number;
  cases: CaseResult[];
  /** Set when the run failed before any case could execute (bad entry point, compile error). */
  setupError?: string;
}

export function summarizeCases(cases: CaseResult[]): RunResult {
  const casesPassed = cases.filter((c) => c.status === "pass").length;
  const status: RunStatus = cases.some((c) => c.status === "timeout")
    ? "timeout"
    : cases.some((c) => c.status === "error")
      ? "error"
      : casesPassed === cases.length
        ? "passed"
        : "failed";
  return { status, casesPassed, casesTotal: cases.length, cases };
}
