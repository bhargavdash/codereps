import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { LogoMark } from "../../components/ui/Logo";
import { Avatar } from "../../components/ui/Avatar";
import { StreakBadge } from "../../components/ui/StreakBadge";
import { Skeleton } from "../../components/ui/Skeleton";
import { FileCode } from "../../components/icons";
import { RepEditor } from "./RepEditor";
import { PromptPanel } from "./PromptPanel";
import { SessionRail } from "./SessionRail";
import { useRepSession } from "./useRepSession";
import { useChallenge } from "./useChallenge";
import { useAttempt } from "./useAttempt";
import { TraceRecorder } from "./trace";
import { runChallenge } from "./runner/runChallenge";
import { ReactIframeRunner } from "./runner/ReactIframeRunner";
import { warmTsChecker } from "./runner/runTsChallenge";
import type { RunResult } from "@codereps/shared/runner-core";
import type { ClientCaseResult, ClientResults, SubmitResponse } from "@codereps/shared";
import type { DebriefState } from "../results/debrief-state";
import { api } from "../../lib/api";
import { track } from "../../lib/analytics";
import type { WarmupNavState } from "../warmup/WarmupScreen";
import { streakAtRisk, useSummary } from "../../lib/useSummary";
import { useAuth } from "../../lib/auth-context";
import { NotFound } from "../misc/NotFound";

const LANG_LABEL: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  tsx: "React · TSX",
  css: "CSS",
};

type RunInfo =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "compile-error"; message: string }
  | { kind: "unavailable" }
  | { kind: "submit-error"; message: string }
  | { kind: "result"; result: RunResult };

function OffChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-border-2 px-2 py-[3px]">
      <span className="size-[5px] rounded-full bg-muted" />
      <span className="mono text-[11px] text-muted">{label}</span>
    </span>
  );
}

const FAULT_LABEL: Record<string, string> = {
  paste: "paste resisted",
  drop: "drop resisted",
  "middle-click-paste": "paste resisted",
};

function toClientResults(result: RunResult): ClientResults {
  const cases: ClientCaseResult[] = result.cases.map((c) => ({
    name: c.name.slice(0, 200),
    status: c.status,
    ms: Math.max(0, Math.round(c.ms)),
    ...(c.message && { message: c.message.slice(0, 2000) }),
  }));
  return {
    status: result.status,
    casesPassed: result.casesPassed,
    casesTotal: result.casesTotal,
    cases,
  };
}

export function PracticeScreen() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { display: challenge, runnable, loading } = useChallenge(slug);
  const { attempt } = useAttempt(runnable?.id);
  const summary = useSummary();

  const [code, setCode] = useState<string | null>(null);
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [promptOpen, setPromptOpen] = useState(
    typeof window === "undefined" ? true : window.innerWidth >= 1200,
  );
  const [runInfo, setRunInfo] = useState<RunInfo>({ kind: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const [abandonArmed, setAbandonArmed] = useState(false);

  const session = useRepSession(challenge?.parSeconds ?? 240, attempt?.startedAt ?? null);
  const strictPaste =
    (profile?.settings as { strictPaste?: boolean } | undefined)?.strictPaste ?? true;

  const recorder = useMemo(
    () => (challenge ? new TraceRecorder(challenge.starterCode) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [challenge?.slug, challenge?.starterCode],
  );

  useEffect(() => {
    setCode(challenge?.starterCode ?? null);
    setRunInfo({ kind: "idle" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge?.slug, challenge?.starterCode]);

  // the abandon confirm-beat disarms itself
  useEffect(() => {
    if (!abandonArmed) return;
    const id = window.setTimeout(() => setAbandonArmed(false), 3000);
    return () => window.clearTimeout(id);
  }, [abandonArmed]);

  const location = useLocation();
  const warmupCtx = (location.state as WarmupNavState | null)?.warmup ?? null;
  const repInfo = warmupCtx
    ? { n: warmupCtx.n + 1, total: warmupCtx.slugs.length }
    : null;

  // per-runner warm-up: react gets its sandboxed iframe ahead of time,
  // ts_check starts downloading the compiler (S4-1/S4-2)
  const reactRunner = useMemo(
    () => (runnable?.tests.kind === "react_iframe" ? new ReactIframeRunner() : null),
    [runnable],
  );
  useEffect(() => {
    if (reactRunner) {
      reactRunner.warm();
      return () => reactRunner.destroy();
    }
    if (runnable?.tests.kind === "ts_check") warmTsChecker();
  }, [reactRunner, runnable]);

  const runningRef = useRef(false);
  const run = useCallback(async (): Promise<RunResult | { compileError: string } | null> => {
    if (runningRef.current || code === null) return null;
    if (!runnable) {
      setRunInfo({ kind: "unavailable" });
      return null;
    }
    runningRef.current = true;
    setRunInfo({ kind: "running" });
    try {
      const outcome = await runChallenge(code, runnable, { react: reactRunner ?? undefined });
      if (!outcome.ok) {
        setRunInfo({ kind: "compile-error", message: outcome.compileError });
        return { compileError: outcome.compileError };
      }
      setRunInfo({ kind: "result", result: outcome.result });
      return outcome.result;
    } finally {
      runningRef.current = false;
    }
  }, [code, runnable, reactRunner]);

  const finishedRef = useRef(false);
  const finishRep = useCallback(
    async (mode: "submit" | "abandon" | "auto-timeout"): Promise<void> => {
      if (!attempt || !runnable || !challenge || finishedRef.current || submitting || code === null) return;
      setSubmitting(true);
      try {
        let clientResults: ClientResults | null = null; // stays null for abandon
        let cases: ClientCaseResult[] = [];
        const totalCases = runnable.tests.cases.length; // every tests kind carries cases

        if (mode === "auto-timeout") {
          clientResults = { status: "timeout", casesPassed: 0, casesTotal: totalCases, cases: [] };
        } else if (mode === "submit") {
          const outcome = await run();
          if (outcome === null) return;
          clientResults =
            "compileError" in outcome
              ? {
                  status: "error",
                  casesPassed: 0,
                  casesTotal: totalCases,
                  cases: [{ name: "compile", status: "error", ms: 0, message: outcome.compileError }],
                }
              : toClientResults(outcome);
          cases = clientResults.cases;
        }

        const metrics = { keystrokes: session.keystrokes, pasteAttempts: session.faults };
        const traceGz = await recorder?.serialize().catch(() => undefined);

        const submit =
          mode === "abandon"
            ? await api<SubmitResponse>(`/api/v1/attempts/${attempt.attemptId}/abandon`, {
                method: "POST",
                body: JSON.stringify({ code, metrics }),
              })
            : await api<SubmitResponse>(`/api/v1/attempts/${attempt.attemptId}/submit`, {
                method: "POST",
                body: JSON.stringify({ code, clientResults, metrics, traceGz }),
              });

        finishedRef.current = true;
        track(mode === "abandon" ? "rep_abandoned" : "rep_submitted", {
          slug: challenge.slug,
          status: submit.submission.status,
          durationMs: submit.submission.durationMs,
        });
        const state: DebriefState = {
          submit,
          yourCode: code,
          cases,
          faults: session.faults,
          warmup: warmupCtx ?? undefined,
          display: {
            slug: challenge.slug,
            title: challenge.title,
            category: challenge.category,
            topic: challenge.topic,
            difficulty: challenge.difficulty,
            parSeconds: challenge.parSeconds,
            language: challenge.language,
          },
        };
        navigate(`/practice/${challenge.slug}/debrief`, { state });
      } catch (err) {
        setRunInfo({
          kind: "submit-error",
          message: err instanceof Error ? err.message : "Submit failed — try again",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [attempt, runnable, challenge, code, session.keystrokes, session.faults, recorder, run, navigate, submitting, warmupCtx],
  );

  useEffect(() => {
    if (attempt && challenge) track("rep_started", { slug: challenge.slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt?.attemptId]);

  // time-limit expiry → auto-submit timeout (board S3-1)
  useEffect(() => {
    if (!attempt || finishedRef.current) return;
    if (session.elapsed >= attempt.timeLimitSeconds) {
      void finishRep("auto-timeout");
    }
  }, [session.elapsed, attempt, finishRep]);

  // refresh/close guard while a rep is open (critique backlog P1)
  useEffect(() => {
    if (!attempt) return;
    const guard = (e: BeforeUnloadEvent) => {
      if (!finishedRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [attempt]);

  const onAbandon = useCallback(() => {
    if (!abandonArmed) {
      setAbandonArmed(true);
      return;
    }
    setAbandonArmed(false);
    void finishRep("abandon");
  }, [abandonArmed, finishRep]);

  // ⌘Enter is scoped to editor focus (critique backlog P1 — no global submit)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (!session.editing) return;
        e.preventDefault();
        void finishRep("submit");
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        void run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finishRep, run, session.editing]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col gap-4 bg-bg p-8" aria-busy="true">
        <Skeleton width={280} height={16} />
        <Skeleton width="100%" height={2} />
        <div className="flex flex-1 gap-6">
          <Skeleton width={320} height={400} />
          <div className="flex-1">
            <Skeleton width="100%" height={400} />
          </div>
        </div>
      </div>
    );
  }
  if (!challenge) return <NotFound />;

  const editing = session.editing;

  const statusStrip = (() => {
    switch (runInfo.kind) {
      case "running":
        return { text: "running…", color: "var(--color-faint)" };
      case "compile-error":
        return { text: runInfo.message, color: "var(--color-fail)" };
      case "submit-error":
        return { text: runInfo.message, color: "var(--color-fail)" };
      case "unavailable":
        return { text: "runner not available for this challenge yet", color: "var(--color-faint)" };
      case "result": {
        const r = runInfo.result;
        const totalMs = r.cases.reduce((a, c) => a + c.ms, 0);
        const color =
          r.status === "passed"
            ? "var(--color-pass)"
            : r.status === "timeout"
              ? "var(--color-timeout)"
              : "var(--color-fail)";
        const text = r.setupError ? r.setupError : `${r.casesPassed}/${r.casesTotal} · ${totalMs}ms`;
        return { text, color };
      }
      default:
        return { text: "no autocomplete", color: "var(--color-faint)" };
    }
  })();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      {/* Top bar */}
      <div
        className="flex h-[52px] shrink-0 items-center justify-between border-b border-border px-5 transition-opacity duration-200"
        style={{ opacity: editing ? 0.5 : 1 }}
      >
        <div className="flex items-center gap-4">
          <Link
            to="/warmup"
            className="flex items-center gap-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
          >
            <LogoMark size={18} />
            <span className="text-[15px] font-semibold tracking-[-0.01em]">CodeReps</span>
          </Link>
          <span className="h-[18px] w-px bg-border-2" />
          <span className="mono text-[12.5px] text-muted">
            {repInfo ? (
              <>
                Warmup&nbsp; · &nbsp;Rep <span className="text-[oklch(0.88_0.005_250)]">{repInfo.n}</span> of{" "}
                {repInfo.total}
              </>
            ) : (
              "Free practice"
            )}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {summary && (
            <StreakBadge
              days={summary.streak.current}
              alive={summary.streak.qualifiedToday}
              atRisk={streakAtRisk(summary)}
            />
          )}
          <span className="h-[18px] w-px bg-border-2" />
          <Avatar initials={(profile?.username ?? "??").slice(0, 2).toUpperCase()} size={26} />
        </div>
      </div>

      {/* Workspace */}
      <div className="flex min-h-0 flex-1">
        <PromptPanel
          challenge={challenge}
          open={promptOpen}
          onToggle={() => setPromptOpen((v) => !v)}
          dim={editing}
        />

        {/* Editor — the hero, never recedes */}
        <section className="relative flex min-w-0 flex-1 flex-col bg-editor">
          <div className="flex h-[42px] shrink-0 items-stretch border-b border-border pl-1">
            <div className="-mb-px flex items-center gap-2 border-b-2 border-primary px-4">
              <FileCode size={13} style={{ color: "var(--color-ink-mute)" }} />
              <span className="mono text-[13px] text-[oklch(0.9_0.005_250)]">{challenge.fileName}</span>
            </div>
            <div className="flex-1" />
            <div
              className="flex items-center gap-2.5 pr-4 transition-opacity duration-200"
              style={{ opacity: editing ? 0.5 : 1 }}
            >
              <OffChip label="AI OFF" />
              <OffChip label={strictPaste ? "PASTE OFF" : "PASTE COUNTED"} />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {code !== null && (
              <RepEditor
                value={code}
                onChange={setCode}
                language={challenge.language}
                strictPaste={strictPaste}
                onFault={session.recordFault}
                onKeystrokes={session.addKeystrokes}
                onTraceChanges={(changes) => recorder?.record(changes)}
                onCursor={(line, col) => setCursor({ line, col })}
                onFocusChange={session.setEditing}
              />
            )}
          </div>

          {session.lastFault && (
            <div
              key={session.lastFault.seq}
              role="status"
              className="pointer-events-none absolute right-4 top-[52px] rounded-md border border-border-2 bg-raised px-3 py-1.5"
            >
              <span className="mono text-[11.5px] tracking-[0.04em] text-accent">
                {FAULT_LABEL[session.lastFault.kind]} · FAULT +1
              </span>
            </div>
          )}

          <div className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-bg px-4">
            <div className="flex items-center gap-4">
              <span className="mono text-[11.5px] text-muted-2">
                Ln {cursor.line}, Col {cursor.col}
              </span>
              <span className="mono text-[11.5px] text-muted-2">Spaces: 2</span>
              <span className="mono text-[11.5px] text-muted-2">{LANG_LABEL[challenge.language]}</span>
            </div>
            <span
              className="mono max-w-[60%] truncate text-[11.5px]"
              style={{ color: statusStrip.color }}
              aria-live="polite"
            >
              {statusStrip.text}
            </span>
          </div>
        </section>

        <SessionRail
          challenge={challenge}
          elapsed={session.elapsed}
          keystrokes={session.keystrokes}
          faults={session.faults}
          over={session.over}
          barPct={session.barPct}
          editing={editing}
          onRun={() => void run()}
          onSubmit={() => void finishRep("submit")}
          onAbandon={attempt ? onAbandon : undefined}
          submitDisabled={!attempt || !runnable}
          submitting={submitting}
          abandonArmed={abandonArmed}
        />
      </div>

      {import.meta.env.DEV && (
        <div className="pointer-events-none fixed bottom-3 left-3 z-50 rounded-md border border-border-2 bg-surface/90 px-3 py-2">
          <span className="mono text-[10.5px] leading-relaxed text-muted">
            keys {session.keystrokes} · faults {session.faults} · trace {recorder?.size ?? 0} ops ·{" "}
            {attempt ? `attempt ${attempt.attemptId.slice(0, 8)}` : runnable ? "no attempt" : "mock"}
          </span>
        </div>
      )}
    </div>
  );
}
