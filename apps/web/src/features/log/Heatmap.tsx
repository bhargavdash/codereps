import { useMemo } from "react";
import { buildHeatLevels, LOG_TOTALS } from "../../data/app-data";

const HEAT_VARS = [
  "var(--color-heat-0)",
  "var(--color-heat-1)",
  "var(--color-heat-2)",
  "var(--color-heat-3)",
  "var(--color-heat-4)",
];

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

/** A year of reps in the cobalt ramp — explicitly not GitHub green. */
export function Heatmap() {
  const levels = useMemo(() => buildHeatLevels(), []);
  return (
    <div className="flex flex-col gap-3.5 rounded-[10px] border border-border bg-surface-2 px-6 py-5">
      <div className="flex items-baseline justify-between">
        <span className="mono text-[11px] tracking-[0.09em] text-muted-2">
          {LOG_TOTALS.days} DAYS · {LOG_TOTALS.reps} REPS
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
        <div
          className="grid shrink-0 pt-px"
          style={{ gridTemplateRows: "repeat(7, 12px)", rowGap: 3 }}
        >
          {(["Mon", "Wed", "Fri"] as const).map((d, i) => (
            <span
              key={d}
              className="mono text-[9px] leading-[12px] text-faint"
              style={{ gridRow: (i + 1) * 2 }}
            >
              {d}
            </span>
          ))}
        </div>
        <div
          className="grid"
          style={{
            gridTemplateRows: "repeat(7, 12px)",
            gridAutoFlow: "column",
            gridAutoColumns: "12px",
            gap: 3,
          }}
          role="img"
          aria-label={`${LOG_TOTALS.reps} reps over ${LOG_TOTALS.days} days`}
        >
          {levels.map((level, i) => (
            <span key={i} className="size-3 rounded-[2px]" style={{ background: HEAT_VARS[level] }} />
          ))}
        </div>
      </div>

      <div className="flex gap-11 pl-[46px]">
        {["Aug", "Oct", "Dec", "Feb", "Apr", "Jun"].map((m) => (
          <span key={m} className="mono text-[10px] text-faint">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
