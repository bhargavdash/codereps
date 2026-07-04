import { cn } from "../../lib/cn";

/** Difficulty as filled/empty rep dots (●●●○○ = D3) — a workout notation. */
export function RepDots({
  level,
  size = 8,
  max = 5,
  showLabel = false,
  className,
}: {
  level: number;
  size?: number;
  max?: number;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span
        className="inline-flex items-center gap-1"
        role="img"
        aria-label={`Difficulty ${level} of ${max}`}
      >
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className="rounded-full"
            style={{
              width: size,
              height: size,
              background: i < level ? "var(--color-dot-on)" : "var(--color-dot-off)",
            }}
          />
        ))}
      </span>
      {showLabel && (
        <span className="mono ml-1 text-[11px] text-muted" aria-hidden="true">
          D{level}
        </span>
      )}
    </span>
  );
}
