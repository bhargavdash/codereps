import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { TraceRecorder } from "./trace";
import { compileForRun } from "../../lib/compile";
import { runJsChallenge } from "./runner/runJsChallenge";
import type { RunResult } from "@codereps/shared/runner-core";
import { STREAK, USER, WARMUP } from "../../data/app-data";
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

export function PracticeScreen() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { display: challenge, runnable, loading } = useChallenge(slug);

  const [code, setCode] = useState<string | null>(null); // null until starter known
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [promptOpen, setPromptOpen] = useState(
    typeof window === "undefined" ? true : window.innerWidth >= 1200,
  );
  const [runInfo, setRunInfo] = useState<RunInfo>({ kind: "idle" });

  const session = useRepSession(challenge?.parSeconds ?? 240);
  const strictPaste =
    (profile?.settings as { strictPaste?: boolean } | undefined)?.strictPaste ?? true;

  // one ghost trace per rep, based on the real starter (will-bite #3)
  const recorder = useMemo(
    () => (challenge ? new TraceRecorder(challenge.starterCode) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [challenge?.slug, challenge?.starterCode],
  );

  // seed the editor once the (real or mock) starter is known
  useEffect(() => {
    setCode(challenge?.starterCode ?? null);
    setRunInfo({ kind: "idle" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge?.slug, challenge?.starterCode]);

  const repInfo = useMemo(() => {
    const idx = WARMUP.reps.findIndex((r) => r.slug === slug);
    return idx >= 0 ? { n: idx + 1, total: WARMUP.reps.length } : null;
  }, [slug]);

  const runningRef = useRef(false);
  const run = async (): Promise<void> => {
    if (runningRef.current || code === null) return;
    if (!runnable || runnable.tests.kind !== "js_worker") {
      setRunInfo({ kind: "unavailable" });
      return;
    }
    runningRef.current = true;
    setRunInfo({ kind: "running" });
    try {
      const compiled = compileForRun(code, runnable.language);
      if (!compiled.ok) {
        setRunInfo({ kind: "compile-error", message: compiled.message });
        return;
      }
      const result = await runJsChallenge(compiled.code, runnable.tests);
      setRunInfo({ kind: "result", result });
    } finally {
      runningRef.current = false;
    }
  };

  const submit = () => challenge && navigate(`/practice/${challenge.slug}/debrief`);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        void run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge, runnable, code]);

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
        const text = r.setupError
          ? r.setupError
          : `${r.casesPassed}/${r.casesTotal} · ${totalMs}ms`;
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
          <StreakBadge days={STREAK.days} alive={STREAK.alive} />
          <span className="h-[18px] w-px bg-border-2" />
          <Avatar initials={USER.initials} size={26} />
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

          {/* fault toast — honest, typographic, self-clearing */}
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
          onSubmit={submit}
        />
      </div>

      {/* dev-only metrics overlay (board S2-2 done-when) */}
      {import.meta.env.DEV && (
        <div className="pointer-events-none fixed bottom-3 left-3 z-50 rounded-md border border-border-2 bg-surface/90 px-3 py-2">
          <span className="mono text-[10.5px] leading-relaxed text-muted">
            keys {session.keystrokes} · faults {session.faults} · trace {recorder?.size ?? 0} ops ·{" "}
            {runnable ? "runnable" : "mock"}
          </span>
        </div>
      )}
    </div>
  );
}
