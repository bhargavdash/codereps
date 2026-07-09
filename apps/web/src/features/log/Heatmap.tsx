import { useMemo } from "react";
import type { HeatmapResponse } from "@codereps/shared";

const HEAT_VARS = [
  "var(--color-heat-0)",
  "var(--color-heat-1)",
  "var(--color-heat-2)",
  "var(--color-heat-3)",
  "var(--color-heat-4)",
];

/** submissions → cobalt ramp level */
export function heatLevel(submissions: number): number {
  if (submissions <= 0) return 0;
  if (submissions === 1) return 1;
  if (submissions <= 3) return 2;
  if (submissions <= 6) return 3;
  return 4;
}

function Swatch({ level }: { level: number }) {
  return (
    <span
      className="size-[11px] rounded-[2px]"
      style={{
        background: HEAT_VARS[level],
        border: level === 0 ? "1px solid var(--color-border-2)" : undefined,
      }}
    />
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Cell {
  date: string;
  level: number;
  submissions: number;
  minutes: number;
}

/** A year of reps in the cobalt ramp — explicitly not GitHub green. */
export function Heatmap({ heatmap, totals }: { heatmap: HeatmapResponse; totals: { activeDays: number; totalReps: number } }) {
  const { cells, leadingBlanks, monthLabels } = useMemo(() => {
    const byDate = new Map(heatmap.days.map((d) => [d.date, d]));
    const cells: Cell[] = [];
    const monthLabels: { col: number; label: string }[] = [];

    const start = new Date(`${heatmap.from}T00:00:00Z`);
    const end = new Date(`${heatmap.to}T00:00:00Z`);
    // rows are Mon..Sun; offset the first column so dates land on their weekday
    const leadingBlanks = (start.getUTCDay() + 6) % 7;

    let index = 0;
    for (let t = start.getTime(); t <= end.getTime(); t += 24 * 3600 * 1000) {
      const d = new Date(t);
      const date = d.toISOString().slice(0, 10);
      const row = byDate.get(date);
      if (d.getUTCDate() === 1) {
        monthLabels.push({ col: Math.floor((index + leadingBlanks) / 7), label: MONTHS[d.getUTCMonth()]! });
      }
      cells.push({
        date,
        level: heatLevel(row?.submissions ?? 0),
        submissions: row?.submissions ?? 0,
        minutes: row?.minutesActive ?? 0,
      });
      index++;
    }
    return { cells, leadingBlanks, monthLabels };
  }, [heatmap]);

  return (
    <div className="flex flex-col gap-3.5 rounded-[10px] border border-border bg-surface-2 px-6 py-5">
      <div className="flex items-baseline justify-between">
        <span className="mono text-[11px] tracking-[0.09em] text-muted-2">
          {totals.totalReps === 0
            ? "DAY 1 STARTS TODAY — YOUR FIRST REP LIGHTS THE FIRST CELL"
            : `${totals.activeDays} ACTIVE ${totals.activeDays === 1 ? "DAY" : "DAYS"} · ${totals.totalReps} REPS`}
        </span>
        <div className="flex items-center gap-[7px]">
          <span className="mono text-[11px] text-muted-2">less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <Swatch key={l} level={l} />
          ))}
          <span className="mono text-[11px] text-muted-2">more</span>
        </div>
      </div>

      <div className="flex gap-2.5 overflow-x-auto">
        <div className="grid shrink-0 pt-px" style={{ gridTemplateRows: "repeat(7, 12px)", rowGap: 3 }}>
          {(["Mon", "Wed", "Fri"] as const).map((d, i) => (
            <span
              key={d}
              className="mono text-[9px] leading-[12px] text-faint"
              style={{ gridRow: i * 2 + 1 }}
            >
              {d}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <div
            className="grid"
            style={{
              gridTemplateRows: "repeat(7, 12px)",
              gridAutoFlow: "column",
              gridAutoColumns: "12px",
              gap: 3,
            }}
            role="img"
            aria-label={`${totals.totalReps} reps over ${totals.activeDays} active days`}
          >
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {cells.map((cell) => (
              <span
                key={cell.date}
                className="size-3 rounded-[2px]"
                style={{
                  background: HEAT_VARS[cell.level],
                  border: cell.level === 0 ? "1px solid oklch(0.17 0.005 250)" : undefined,
                }}
                title={`${cell.date} · ${cell.submissions} rep${cell.submissions === 1 ? "" : "s"} · ${cell.minutes} min`}
              />
            ))}
          </div>
          <div className="relative h-3.5">
            {monthLabels.map((m, i) => (
              <span
                key={`${m.label}-${i}`}
                className="mono absolute text-[10px] text-faint"
                style={{ left: m.col * 15 }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
