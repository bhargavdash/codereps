import { useEffect, useState } from "react";
import { AppShell, Container } from "../../components/layout/AppShell";
import { Skeleton } from "../../components/ui/Skeleton";
import { Flame } from "../../components/icons";
import { Heatmap, heatLevel } from "./Heatmap";
import { api } from "../../lib/api";
import { streakAtRisk, useSummary } from "../../lib/useSummary";
import { CATEGORY_LABEL } from "../../data/types";
import type { CategorySummary, HeatmapResponse, MeSummaryResponse } from "@codereps/shared";

const HEAT_VARS = [
  "var(--color-heat-0)",
  "var(--color-heat-1)",
  "var(--color-heat-2)",
  "var(--color-heat-3)",
  "var(--color-heat-4)",
];

type Readiness = CategorySummary["readiness"];

const readinessConfig: Record<Readiness, { word: string; wordColor: string; dot: string }> = {
  ready: { word: "READY", wordColor: "var(--color-pass)", dot: "var(--color-pass)" },
  "needs-work": { word: "NEEDS WORK", wordColor: "var(--color-accent)", dot: "var(--color-timeout)" },
  "not-practiced": { word: "NOT PRACTICED", wordColor: "var(--color-muted-2)", dot: "var(--color-faint)" },
};

/** Evidence STATEMENTS, not gauges — §9 readiness with its receipts. */
function evidenceFor(row: CategorySummary): string {
  const trained =
    row.daysSinceLastTrained === null
      ? "never trained"
      : row.daysSinceLastTrained === 0
        ? "trained today"
        : `last trained ${row.daysSinceLastTrained}d ago`;
  switch (row.readiness) {
    case "ready":
      return `${row.passedCount} passed · ${row.passedAtD4Plus} at D4+ · ${trained}`;
    case "needs-work": {
      const gaps: string[] = [];
      if (row.score !== null && row.score < 80) gaps.push(`fluency ${Math.round(row.score)}`);
      if (row.passedCount < 8) gaps.push(`${row.passedCount} passed (needs 8)`);
      if (row.passedAtD4Plus < 2) gaps.push(`${row.passedAtD4Plus} at D4+ (needs 2)`);
      if (row.daysSinceLastTrained !== null && row.daysSinceLastTrained > 14) gaps.push("going stale");
      return `${gaps.join(" · ") || "close"} · ${trained}`;
    }
    case "not-practiced":
      return row.passedCount === 0
        ? "No reps yet — your first one sets the baseline."
        : `${row.passedCount} passed — ${5 - row.passedCount} more to unlock a score.`;
  }
}

function Sparkline({ points }: { points: { score: number }[] }) {
  if (points.length < 3) {
    return (
      <span className="mono w-24 text-center text-[11px] text-faint" aria-hidden="true">
        — — — — —
      </span>
    );
  }
  const rising = points[points.length - 1]!.score >= points[0]!.score;
  const w = 96;
  const h = 28;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = (1 - p.score / 100) * (h - 6) + 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="shrink-0" aria-hidden="true">
      <polyline
        points={coords}
        stroke={rising ? "var(--color-primary)" : "var(--color-accent)"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReadinessRowItem({ row }: { row: CategorySummary }) {
  const c = readinessConfig[row.readiness];
  const displayScore = row.score === null ? null : Math.round(row.score);
  const fluencyColor =
    row.readiness === "not-practiced"
      ? "var(--color-faint)"
      : row.readiness === "needs-work"
        ? "var(--color-accent)"
        : "var(--color-ink)";
  return (
    <div className="flex items-center gap-5 px-[22px] py-[15px] [&:not(:first-child)]:border-t [&:not(:first-child)]:border-hair">
      <span className="size-2 shrink-0 rounded-full" style={{ background: c.dot }} />
      <span
        className="w-[150px] text-[15px] font-medium"
        style={{ color: row.readiness === "not-practiced" ? "var(--color-muted)" : "var(--color-ink)" }}
      >
        {CATEGORY_LABEL[row.category]}
      </span>
      <span className="mono w-28 text-[11px] tracking-[0.05em]" style={{ color: c.wordColor }}>
        {c.word}
      </span>
      <span className="flex-1 text-[13.5px] text-muted">{evidenceFor(row)}</span>
      <Sparkline points={row.trend} />
      <span className="mono w-[34px] text-right text-[16px]" style={{ color: fluencyColor }}>
        {displayScore ?? "·"}
      </span>
    </div>
  );
}

function StreakCard({ summary, heatmap }: { summary: MeSummaryResponse; heatmap: HeatmapResponse | null }) {
  const atRisk = streakAtRisk(summary);
  const last7: { level: number; today?: boolean }[] = (() => {
    if (!heatmap) return [];
    const byDate = new Map(heatmap.days.map((d) => [d.date, d.submissions]));
    const out: { level: number; today?: boolean }[] = [];
    const end = new Date(`${heatmap.to}T00:00:00Z`);
    for (let back = 6; back >= 0; back--) {
      const date = new Date(end.getTime() - back * 24 * 3600 * 1000).toISOString().slice(0, 10);
      out.push({ level: heatLevel(byDate.get(date) ?? 0), today: back === 0 });
    }
    return out;
  })();

  return (
    <div className="flex items-center gap-[22px] rounded-[10px] border border-border bg-surface px-[22px] py-4">
      <div className="flex items-center gap-3.5">
        <Flame
          size={30}
          style={{
            color: summary.streak.qualifiedToday
              ? "var(--color-accent)"
              : atRisk
                ? "var(--color-timeout)"
                : "var(--color-muted-2)",
          }}
        />
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="mono text-[34px] font-medium leading-none">{summary.streak.current}</span>
            <span className="text-[13px] text-muted">days</span>
          </div>
          <span className="text-[11.5px] text-muted">
            streak ·{" "}
            {summary.streak.qualifiedToday ? (
              <span style={{ color: "var(--color-pass)" }}>trained today</span>
            ) : atRisk ? (
              <span style={{ color: "var(--color-timeout)" }}>at risk — train before midnight</span>
            ) : (
              <span>not yet today</span>
            )}{" "}
            · best {summary.streak.longest}
          </span>
        </div>
      </div>
      {last7.length > 0 && (
        <>
          <span className="h-10 w-px bg-border" />
          <div className="flex flex-col gap-[7px]">
            <span className="mono text-[10px] tracking-[0.1em] text-muted-2">LAST 7</span>
            <div className="flex gap-[5px]">
              {last7.map((d, i) => (
                <span
                  key={i}
                  className="size-[13px] rounded-[3px]"
                  style={{
                    background: d.today && d.level > 0 ? "var(--color-accent)" : HEAT_VARS[d.level],
                    border: d.level === 0 ? "1px solid var(--color-border-2)" : undefined,
                  }}
                  title={d.today ? "today" : undefined}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function LogScreen() {
  const summary = useSummary();
  const [heatmap, setHeatmap] = useState<HeatmapResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<HeatmapResponse>("/api/v1/me/heatmap")
      .then((res) => {
        if (!cancelled) setHeatmap(res);
      })
      .catch(() => void 0);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <Container size="wide" className="flex flex-col gap-7 py-8">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[28px] font-semibold tracking-[-0.015em]">Training log</h1>
            <p className="text-sm text-muted">
              Fluency is earned and it decays. Here is where yours actually stands.
            </p>
          </div>
          {summary ? (
            <StreakCard summary={summary} heatmap={heatmap} />
          ) : (
            <Skeleton width={300} height={72} />
          )}
        </div>

        {heatmap && summary ? (
          <Heatmap heatmap={heatmap} totals={summary.totals} />
        ) : (
          <Skeleton width="100%" height={140} />
        )}

        <div className="flex flex-col gap-3">
          <span className="mono text-[11px] tracking-[0.09em] text-muted-2">READINESS BY CATEGORY</span>
          <div className="flex flex-col overflow-hidden rounded-[10px] border border-border">
            {summary ? (
              summary.categories.map((row) => <ReadinessRowItem key={row.category} row={row} />)
            ) : (
              <div className="flex flex-col gap-4 p-5" aria-busy="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} width={`${80 - i * 8}%`} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </AppShell>
  );
}
