import { AppShell, Container } from "../../components/layout/AppShell";
import { Flame } from "../../components/icons";
import { Heatmap } from "./Heatmap";
import { LAST_7, READINESS, STREAK } from "../../data/app-data";
import type { Readiness, ReadinessRow } from "../../data/types";

const HEAT_VARS = [
  "var(--color-heat-0)",
  "var(--color-heat-1)",
  "var(--color-heat-2)",
  "var(--color-heat-3)",
  "var(--color-heat-4)",
];

const readinessConfig: Record<
  Readiness,
  { word: string; wordColor: string; dot: string }
> = {
  sharp: { word: "SHARP", wordColor: "var(--color-pass)", dot: "var(--color-pass)" },
  ready: { word: "READY", wordColor: "var(--color-pass)", dot: "var(--color-pass)" },
  "needs-work": { word: "NEEDS WORK", wordColor: "var(--color-accent)", dot: "var(--color-timeout)" },
  untrained: { word: "UNTRAINED", wordColor: "var(--color-muted-2)", dot: "var(--color-faint)" },
};

function Sparkline({ points, rising }: { points: number[]; rising: boolean }) {
  if (points.length === 0) {
    return (
      <span className="mono w-24 text-center text-[11px] text-faint" aria-hidden="true">
        — — — — —
      </span>
    );
  }
  const w = 96;
  const h = 28;
  const coords = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = (1 - v) * (h - 6) + 3;
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

function ReadinessRowItem({ row }: { row: ReadinessRow }) {
  const c = readinessConfig[row.readiness];
  const fluencyColor =
    row.readiness === "untrained"
      ? "var(--color-faint)"
      : row.readiness === "needs-work"
        ? "var(--color-accent)"
        : "var(--color-ink)";
  return (
    <div className="flex items-center gap-5 px-[22px] py-[15px] [&:not(:first-child)]:border-t [&:not(:first-child)]:border-hair">
      <span className="size-2 shrink-0 rounded-full" style={{ background: c.dot }} />
      <span
        className="w-[150px] text-[15px] font-medium"
        style={{ color: row.readiness === "untrained" ? "var(--color-muted)" : "var(--color-ink)" }}
      >
        {row.label}
      </span>
      <span className="mono w-24 text-[11px] tracking-[0.05em]" style={{ color: c.wordColor }}>
        {c.word}
      </span>
      <span className="flex-1 text-[13.5px] text-muted">{row.evidence}</span>
      <Sparkline points={row.trend} rising={row.rising} />
      <span className="mono w-[34px] text-right text-[16px]" style={{ color: fluencyColor }}>
        {row.fluency ?? "·"}
      </span>
    </div>
  );
}

export function LogScreen() {
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

          <div className="flex items-center gap-[22px] rounded-[10px] border border-border bg-surface px-[22px] py-4">
            <div className="flex items-center gap-3.5">
              <Flame size={30} style={{ color: "var(--color-accent)" }} />
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="mono text-[34px] font-medium leading-none">{STREAK.days}</span>
                  <span className="text-[13px] text-muted">days</span>
                </div>
                <span className="text-[11.5px] text-muted">
                  streak · <span style={{ color: "var(--color-pass)" }}>trained today</span>
                </span>
              </div>
            </div>
            <span className="h-10 w-px bg-border" />
            <div className="flex flex-col gap-[7px]">
              <span className="mono text-[10px] tracking-[0.1em] text-muted-2">LAST 7</span>
              <div className="flex gap-[5px]">
                {LAST_7.map((d, i) => (
                  <span
                    key={i}
                    className="size-[13px] rounded-[3px]"
                    style={{
                      background: d.today ? "var(--color-accent)" : HEAT_VARS[d.level],
                      border: d.level === 0 && !d.today ? "1px solid var(--color-border-2)" : undefined,
                    }}
                    title={d.today ? "today" : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <Heatmap />

        <div className="flex flex-col gap-3">
          <span className="mono text-[11px] tracking-[0.09em] text-muted-2">READINESS BY CATEGORY</span>
          <div className="flex flex-col overflow-hidden rounded-[10px] border border-border">
            {READINESS.map((row) => (
              <ReadinessRowItem key={row.label} row={row} />
            ))}
          </div>
        </div>
      </Container>
    </AppShell>
  );
}
