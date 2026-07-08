import { cn } from "../../lib/cn";
import { Flame } from "../icons";

/**
 * Streak: amber flame when trained today, amber-warning when the evening is
 * slipping (after 8pm, unqualified), muted otherwise. Honest, not gamified.
 */
export function StreakBadge({
  days,
  alive = true,
  atRisk = false,
  size = 14,
  className,
}: {
  days: number;
  alive?: boolean;
  /** true after 20:00 user-time with today not yet qualified (S5-3). */
  atRisk?: boolean;
  size?: number;
  className?: string;
}) {
  const color = alive
    ? "var(--color-accent)"
    : atRisk
      ? "var(--color-timeout)"
      : "var(--color-muted-2)";
  const title = alive
    ? `${days}-day streak · trained today`
    : atRisk
      ? `${days}-day streak · AT RISK — train before midnight`
      : `${days}-day streak · not yet today`;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={title}>
      <Flame size={size} style={{ color, opacity: alive ? 1 : 0.9 }} />
      <span
        className="mono text-[13px] tracking-[0.02em]"
        style={{ color: alive ? "var(--color-accent)" : atRisk ? "var(--color-timeout)" : "var(--color-muted)" }}
      >
        {days}
      </span>
      {atRisk && (
        <span className="mono text-[10px] tracking-[0.06em]" style={{ color: "var(--color-timeout)" }}>
          AT RISK
        </span>
      )}
    </span>
  );
}
