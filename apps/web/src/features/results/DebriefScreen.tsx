import { useMemo } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, buttonClasses } from "../../components/ui/Button";
import { RepDots } from "../../components/ui/RepDots";
import { Check, ChevronLeft, ChevronRight, ClockAlert, Cross, Lock } from "../../components/icons";
import { ReadOnlyCode } from "./ReadOnlyCode";
import type { DebriefState } from "./debrief-state";
import { WARMUP } from "../../data/app-data";
import { CATEGORY_LABEL, type Challenge } from "../../data/types";
import { diffLines } from "../../lib/line-diff";
import { fmtClock, fmtDelta } from "../../lib/format";
import type { SubmissionStatus } from "@codereps/shared";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mono text-[11px] tracking-[0.09em] text-muted-2">{children}</span>;
}

/** Verdict styling per status — the FAIL/TIMEOUT/ABANDONED debriefs exist now (backlog P1). */
function verdictConfig(status: SubmissionStatus, passed: number, total: number) {
  switch (status) {
    case "passed":
      return { word: "PASSED", color: "var(--color-pass)", Icon: Check };
    case "failed":
      return { word: `${passed}/${total} CASES`, color: "var(--color-fail)", Icon: Cross };
    case "timeout":
      return { word: "TIMEOUT", color: "var(--color-timeout)", Icon: ClockAlert };
    case "error":
      return { word: "ERROR", color: "var(--color-fail)", Icon: Cross };
    case "abandoned":
      return { word: "ABANDONED", color: "var(--color-muted)", Icon: Lock };
  }
}

/** One honest sentence about the rep — evidence, not cheerleading. */
function verdictNote(state: DebriefState): string {
  const { submit, faults } = state;
  const s = submit.submission;
  const unaided = faults === 0 ? "unaided" : `${faults} fault${faults === 1 ? "" : "s"}`;
  switch (s.status) {
    case "passed": {
      const underPar = s.durationMs / 1000 <= state.display.parSeconds;
      return underPar
        ? `Correct on every case, under par, ${unaided}. A clean rep.`
        : `Correct on every case, over par, ${unaided}. Accuracy is there — speed comes with reps.`;
    }
    case "failed":
      return `${s.testsPassed} of ${s.testsTotal} cases passed, ${unaided}. Study the diff, then re-rep it.`;
    case "timeout":
      return "The clock beat you this time. The pattern below is the one to drill.";
    case "error":
      return "The code didn't run cleanly. Compare against the standard and re-rep.";
    case "abandoned":
      return "Rep ended early — no score recorded. Reading the standard is still training.";
  }
}

export function DebriefScreen() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as DebriefState | null;

  const diff = useMemo(
    () => (state ? diffLines(state.yourCode, state.submit.solutionCode) : null),
    [state],
  );

  // refreshed or deep-linked: no submission context — back to the rep
  if (!state || state.display.slug !== slug) {
    return <Navigate to={`/practice/${slug}`} replace />;
  }

  const { submit, display, cases, faults } = state;
  const s = submit.submission;
  const v = verdictConfig(s.status, s.testsPassed, s.testsTotal);
  const timeSeconds = Math.round(s.durationMs / 1000);
  const delta = timeSeconds - display.parSeconds;
  const parRatio = (timeSeconds / display.parSeconds).toFixed(2);
  const totalTestMs = cases.reduce((a, c) => a + c.ms, 0);

  const nextIdx = WARMUP.reps.findIndex((r) => r.slug === slug) + 1;
  const next = WARMUP.reps[nextIdx];

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-10 flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-bg px-6">
        <div className="flex items-center gap-3.5">
          <Link to="/warmup" className={buttonClasses("ghost", "sm", "bg", "gap-1.5 px-1.5 text-[13px]")}>
            <ChevronLeft size={14} />
            Warmup
          </Link>
          <span className="h-4 w-px bg-border-2" />
          <span className="text-sm font-medium text-[oklch(0.9_0.005_250)]">Debrief</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="mono text-[12.5px] text-muted">
            streak <span className="text-ink">{submit.streak.current}</span>
            {submit.streak.qualifiedToday ? " · today counts" : ""}
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(next ? `/practice/${next.slug}` : "/library")}
            className="gap-2 px-4 py-[9px] text-[13.5px]"
          >
            {next ? "Next rep" : "Back to library"}
            <ChevronRight size={14} />
          </Button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1340px] flex-1 flex-col gap-6 px-10 py-8">
        {/* Verdict band — reads like a race result */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-[18px]">
              <span
                className="flex size-[58px] shrink-0 items-center justify-center rounded-[10px]"
                style={{
                  background: `color-mix(in oklch, ${v.color} 14%, transparent)`,
                  border: `1px solid color-mix(in oklch, ${v.color} 40%, transparent)`,
                }}
              >
                <v.Icon size={30} style={{ color: v.color }} />
              </span>
              <div className="flex flex-col gap-1.5">
                <span
                  className="text-[40px] font-semibold leading-none tracking-[-0.02em]"
                  style={{ color: v.color }}
                >
                  {v.word}
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm text-muted">
                    {display.title} · {CATEGORY_LABEL[display.category]} · {display.topic}
                  </span>
                  <RepDots level={display.difficulty} size={6} />
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-3.5 pl-0.5">
              <span className="mono text-[30px] font-medium tracking-[-0.01em] text-ink">
                {fmtClock(timeSeconds)}
              </span>
              <span className="mono text-[16px] text-muted">
                <span style={{ color: delta <= 0 ? "var(--color-pass)" : "var(--color-timeout)" }}>
                  {fmtDelta(delta)}
                </span>{" "}
                vs PAR {fmtClock(display.parSeconds)}
              </span>
            </div>
          </div>

          {submit.fluency.isPersonalBest && s.status === "passed" && (
            <div
              className="cr-pr flex flex-col items-center gap-1 rounded-lg px-5 py-3"
              style={{ border: "1.5px solid var(--color-accent)", transform: "rotate(-4deg)" }}
            >
              <span
                className="mono text-[26px] font-bold tracking-[0.14em]"
                style={{ color: "var(--color-accent)", paddingLeft: "0.14em" }}
              >
                PR
              </span>
              <span className="mono text-[10.5px] tracking-[0.06em] text-[oklch(0.78_0.1_85)]">
                BEST FLUENCY {submit.fluency.score}
              </span>
            </div>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Content: fluency + splits | diff */}
        <div className="flex min-h-[460px] flex-1 gap-8">
          {/* left */}
          <div className="flex w-[400px] shrink-0 flex-col gap-[22px]">
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-2">
                  <Label>FLUENCY · THIS REP</Label>
                  <div className="flex items-baseline gap-2">
                    <span className="mono text-[48px] font-medium leading-none text-ink">
                      {submit.fluency.score ?? "—"}
                    </span>
                    <span className="mono text-[16px] text-muted-2">/ 100</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span className="mono text-[12px] text-muted">
                    {s.testsPassed} / {s.testsTotal} cases
                  </span>
                  <span className="mono text-[12px] text-muted">{parRatio}× par</span>
                  <span className="mono text-[12px] text-muted">
                    {faults} fault{faults === 1 ? "" : "s"} · {s.keystrokes} keys
                  </span>
                  {submit.fluency.ema !== null && (
                    <span className="mono text-[12px] text-muted-2">ema {submit.fluency.ema}</span>
                  )}
                </div>
              </div>
              <p className="mt-3.5 text-[12.5px] leading-[1.5] text-muted-2">{verdictNote(state)}</p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <Label>TEST SPLITS</Label>
                <span className="mono text-[12px] text-muted">
                  {s.testsPassed} / {s.testsTotal} · {totalTestMs} ms
                </span>
              </div>
              {cases.length === 0 ? (
                <div className="rounded-lg border border-border px-4 py-6 text-center">
                  <span className="text-[13px] text-muted">
                    {s.status === "abandoned"
                      ? "No test run — the rep ended before submit."
                      : "No cases ran — the clock expired first."}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col overflow-hidden rounded-lg border border-border">
                  {cases.map((testCase, i) => {
                    const pass = testCase.status === "pass";
                    const caseColor =
                      testCase.status === "pass"
                        ? "var(--color-pass)"
                        : testCase.status === "timeout"
                          ? "var(--color-timeout)"
                          : "var(--color-fail)";
                    return (
                      <div
                        key={`${testCase.name}-${i}`}
                        className="cr-split flex flex-col gap-1 px-4 py-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-hair"
                        style={{ animationDelay: `${i * 65}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="mono w-[18px] text-[11px] text-muted-2">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="flex-1 text-[13.5px] text-ink-soft">{testCase.name}</span>
                          {pass ? (
                            <Check size={13} style={{ color: caseColor }} />
                          ) : (
                            <Cross size={13} style={{ color: caseColor }} />
                          )}
                          <span className="mono text-[11px]" style={{ color: caseColor }}>
                            {testCase.status}
                          </span>
                          <span className="mono w-[42px] text-right text-[12.5px] text-muted">
                            {testCase.ms} ms
                          </span>
                        </div>
                        {testCase.message && !pass && (
                          <span className="mono pl-[30px] text-[11px] leading-snug text-muted-2">
                            {testCase.message.slice(0, 160)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* right: diff */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <div className="flex gap-2">
                <Label>YOUR REP</Label>
                <span className="mono text-[11px] text-faint">vs</span>
                <Label>THE STANDARD</Label>
              </div>
              <span className="mono text-[12px] text-muted">
                {diff && diff.aChanged.length + diff.bChanged.length > 0
                  ? `${Math.max(diff.aChanged.length, diff.bChanged.length)} lines differ`
                  : "matches the standard"}
              </span>
            </div>
            <div className="flex min-h-0 flex-1 gap-3.5">
              <DiffPane
                dot="var(--color-primary)"
                label="your solution"
                value={state.yourCode}
                language={display.language}
                highlight={diff?.aChanged ?? []}
                kind="your"
              />
              <DiffPane
                dot="var(--color-pass)"
                label="the standard"
                value={submit.solutionCode}
                language={display.language}
                highlight={diff?.bChanged ?? []}
                kind="ref"
              />
            </div>
            {submit.solutionNotesMd && (
              <p className="text-[13px] leading-[1.55] text-muted">{submit.solutionNotesMd}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiffPane({
  dot,
  label,
  value,
  language,
  highlight,
  kind,
}: {
  dot: string;
  label: string;
  value: string;
  language: Challenge["language"];
  highlight: number[];
  kind: "your" | "ref";
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-editor">
      <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
        <span className="size-2 rounded-full" style={{ background: dot }} />
        <span className="mono text-[12px] text-[oklch(0.82_0.005_250)]">{label}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <ReadOnlyCode value={value} language={language} highlightLines={highlight} highlightKind={kind} />
      </div>
    </div>
  );
}
