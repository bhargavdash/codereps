import { cn } from "../../lib/cn";
import { Flame } from "../icons";

/** Streak: amber flame when trained today, muted when at-risk. Honest, not gamified. */
export function StreakBadge({
  days,
  alive = true,
  size = 14,
  className,
}: {
  days: number;
  alive?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={alive ? `${days}-day streak · trained today` : `${days}-day streak · at risk`}
    >
      <Flame size={size} style={{ color: alive ? "var(--color-accent)" : "var(--color-muted-2)" }} />
      <span
        className="mono text-[13px] tracking-[0.02em]"
        style={{ color: alive ? "var(--color-accent)" : "var(--color-muted)" }}
      >
        {days}
      </span>
    </span>
  );
}
