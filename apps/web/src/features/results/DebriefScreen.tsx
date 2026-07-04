import { Fragment } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, buttonClasses } from "../../components/ui/Button";
import { RepDots } from "../../components/ui/RepDots";
import { Check, ChevronLeft, ChevronRight } from "../../components/icons";
import { ReadOnlyCode } from "./ReadOnlyCode";
import { getChallenge } from "../../data/challenges";
import { DEBRIEF, WARMUP } from "../../data/app-data";
import { CATEGORY_LABEL, type Challenge } from "../../data/types";
import { fmtClock, fmtDelta } from "../../lib/format";
import { NotFound } from "../misc/NotFound";

function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((p, i) =>
        p.startsWith("`") && p.endsWith("`") ? (
          <span key={i} className="mono text-[0.92em] text-[oklch(0.82_0.02_250)]">
            {p.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

function buildSummary(challenge: Challenge) {
  if (challenge.slug === DEBRIEF.slug) return DEBRIEF;
  const time = Math.round(challenge.parSeconds * 0.94);
  return {
    slug: challenge.slug,
    verdict: "pass" as const,
    timeSeconds: time,
    parSeconds: challenge.parSeconds,
    isPR: false,
    prevBestSeconds: challenge.parSeconds,
    fluency: 82,
    casesPassed: challenge.tests.length,
    casesTotal: challenge.tests.length,
    parRatio: `${(time / challenge.parSeconds).toFixed(2)}× par`,
    faults: 0,
    unaided: true,
    note: "Correct on every case, under par, unaided. A clean rep.",
    linesDiffer: 0,
    totalTestMs: challenge.tests.reduce((a, t) => a + t.ms, 0),
    yourDiffLines: [] as number[],
    refDiffLines: [] as number[],
  };
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mono text-[11px] tracking-[0.09em] text-muted-2">{children}</span>;
}

export function DebriefScreen() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const challenge = getChallenge(slug);
  if (!challenge) return <NotFound />;

  const s = buildSummary(challenge);
  const delta = s.timeSeconds - s.parSeconds;
  const nextIdx = WARMUP.reps.findIndex((r) => r.slug === slug) + 1;
  const next = WARMUP.reps[nextIdx];

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="sticky top-0 z-10 flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-bg px-6">
        <div className="flex items-center gap-3.5">
          <Link
            to="/warmup"
            className={buttonClasses("ghost", "sm", "bg", "gap-1.5 px-1.5 text-[13px]")}
          >
            <ChevronLeft size={14} />
            Warmup
          </Link>
          <span className="h-4 w-px bg-border-2" />
          <span className="text-sm font-medium text-[oklch(0.9_0.005_250)]">Debrief</span>
        </div>
        <div className="flex items-center gap-4">
          {nextIdx > 0 && (
            <span className="mono text-[12.5px] text-muted">
              Rep {nextIdx} of {WARMUP.reps.length}
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(next ? `/practice/${next.slug}` : "/warmup")}
            className="gap-2 px-4 py-[9px] text-[13.5px]"
          >
            {next ? "Next rep" : "Back to warmup"}
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
                  background: "oklch(0.72 0.15 150 / 0.14)",
                  border: "1px solid oklch(0.72 0.15 150 / 0.4)",
                }}
              >
                <Check size={30} style={{ color: "var(--color-pass)" }} />
              </span>
              <div className="flex flex-col gap-1.5">
                <span
                  className="text-[40px] font-semibold leading-none tracking-[-0.02em]"
                  style={{ color: "var(--color-pass)" }}
                >
                  PASSED
                </span>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm text-muted">
                    {challenge.title} · {CATEGORY_LABEL[challenge.category]} · {challenge.topic}
                  </span>
                  <RepDots level={challenge.difficulty} size={6} />
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-3.5 pl-0.5">
              <span className="mono text-[30px] font-medium tracking-[-0.01em] text-ink">
                {fmtClock(s.timeSeconds)}
              </span>
              <span className="mono text-[16px] text-muted">
                <span style={{ color: delta <= 0 ? "var(--color-pass)" : "var(--color-timeout)" }}>
                  {fmtDelta(delta)}
                </span>{" "}
                vs PAR {fmtClock(s.parSeconds)}
              </span>
            </div>
          </div>

          {s.isPR && (
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
                BEAT {fmtClock(s.prevBestSeconds)}
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
                    <span className="mono text-[48px] font-medium leading-none text-ink">{s.fluency}</span>
                    <span className="mono text-[16px] text-muted-2">/ 100</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span className="mono text-[12px] text-muted">
                    {s.casesPassed} / {s.casesTotal} cases
                  </span>
                  <span className="mono text-[12px] text-muted">{s.parRatio}</span>
                  <span className="mono text-[12px] text-muted">
                    {s.faults} faults · {s.unaided ? "unaided" : "hinted"}
                  </span>
                </div>
              </div>
              <p className="mt-3.5 text-[12.5px] leading-[1.5] text-muted-2">{s.note}</p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="flex items-baseline justify-between">
                <Label>TEST SPLITS</Label>
                <span className="mono text-[12px] text-muted">
                  {s.casesPassed} / {s.casesTotal} · {s.totalTestMs} ms
                </span>
              </div>
              <div className="flex flex-col overflow-hidden rounded-lg border border-border">
                {challenge.tests.map((test, i) => (
                  <div
                    key={test.name}
                    className="cr-split flex items-center gap-3 px-4 py-3 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-hair"
                    style={{ animationDelay: `${i * 65}ms` }}
                  >
                    <span className="mono w-[18px] text-[11px] text-muted-2">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-[13.5px] text-ink-soft">
                      <Inline text={test.name} />
                    </span>
                    <Check size={13} style={{ color: "var(--color-pass)" }} />
                    <span className="mono w-[42px] text-right text-[12.5px] text-muted">{test.ms} ms</span>
                  </div>
                ))}
              </div>
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
                {s.linesDiffer > 0 ? `${s.linesDiffer} lines differ · both correct` : "matches the standard"}
              </span>
            </div>
            <div className="flex min-h-0 flex-1 gap-3.5">
              <DiffPane
                dot="var(--color-primary)"
                label="your solution"
                value={challenge.yourCode}
                language={challenge.language}
                highlight={s.yourDiffLines.map((n) => n + 1)}
                kind="your"
              />
              <DiffPane
                dot="var(--color-pass)"
                label="reference"
                value={challenge.solutionCode}
                language={challenge.language}
                highlight={s.refDiffLines.map((n) => n + 1)}
                kind="ref"
              />
            </div>
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
