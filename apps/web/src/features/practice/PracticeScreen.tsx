import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LogoMark } from "../../components/ui/Logo";
import { Avatar } from "../../components/ui/Avatar";
import { StreakBadge } from "../../components/ui/StreakBadge";
import { FileCode } from "../../components/icons";
import { CodeEditor } from "./CodeEditor";
import { PromptPanel } from "./PromptPanel";
import { SessionRail } from "./SessionRail";
import { useRepSession } from "./useRepSession";
import { getChallenge } from "../../data/challenges";
import { CURRENT_REP, STREAK, USER, WARMUP } from "../../data/app-data";
import { NotFound } from "../misc/NotFound";

const LANG_LABEL: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  tsx: "React · TSX",
  css: "CSS",
};

function OffChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-border-2 px-2 py-[3px]">
      <span className="size-[5px] rounded-full bg-muted" />
      <span className="mono text-[11px] text-muted">{label}</span>
    </span>
  );
}

export function PracticeScreen() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const challenge = getChallenge(slug);

  const seed =
    slug === CURRENT_REP.slug
      ? CURRENT_REP
      : { elapsedSeconds: 0, keystrokes: 0, faults: 0 };

  const [code, setCode] = useState(challenge?.starterCode ?? "");
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [promptOpen, setPromptOpen] = useState(
    typeof window === "undefined" ? true : window.innerWidth >= 1200,
  );
  const [runState, setRunState] = useState<"idle" | "running" | "done">("idle");

  const session = useRepSession(challenge?.parSeconds ?? 240, seed);

  const repInfo = useMemo(() => {
    const idx = WARMUP.reps.findIndex((r) => r.slug === slug);
    return idx >= 0 ? { n: idx + 1, total: WARMUP.reps.length } : null;
  }, [slug]);

  const submit = () => challenge && navigate(`/practice/${challenge.slug}/debrief`);
  const run = () => {
    setRunState("running");
    window.setTimeout(() => setRunState("done"), 550);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge]);

  if (!challenge) return <NotFound />;

  const passed = challenge.tests.filter((t) => t.passed).length;
  const editing = session.editing;

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
        <section className="flex min-w-0 flex-1 flex-col bg-editor">
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
              <OffChip label="PASTE OFF" />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={challenge.language}
              handlers={session.handlers}
              onCursor={(line, col) => setCursor({ line, col })}
            />
          </div>

          <div className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-bg px-4">
            <div className="flex items-center gap-4">
              <span className="mono text-[11.5px] text-muted-2">
                Ln {cursor.line}, Col {cursor.col}
              </span>
              <span className="mono text-[11.5px] text-muted-2">Spaces: 2</span>
              <span className="mono text-[11.5px] text-muted-2">{LANG_LABEL[challenge.language]}</span>
            </div>
            <span
              className="mono text-[11.5px]"
              style={{ color: runState === "done" ? "var(--color-pass)" : "var(--color-faint)" }}
              aria-live="polite"
            >
              {runState === "running"
                ? "running…"
                : runState === "done"
                  ? `${passed}/${challenge.tests.length} · ${challenge.tests.reduce((a, t) => a + t.ms, 0)}ms`
                  : "no autocomplete"}
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
          onRun={run}
          onSubmit={submit}
        />
      </div>
    </div>
  );
}
