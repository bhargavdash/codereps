import { cn } from "../../lib/cn";

/** The CodeReps mark: an iron-square with a stopwatch ring — a timing instrument. */
export function LogoMark({ size = 22, muted = false }: { size?: number; muted?: boolean }) {
  const inset = Math.round(size * 0.27);
  const border = Math.max(1.3, size * 0.082);
  const radius = Math.round(size * 0.23);
  return (
    <span
      className="relative inline-block shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: muted ? "var(--color-raised)" : "var(--color-primary)",
      }}
      aria-hidden="true"
    >
      <span
        className="absolute rounded-full"
        style={{
          inset,
          border: `${border}px solid ${muted ? "var(--color-muted)" : "oklch(0.97 0.005 250)"}`,
          borderRightColor: "transparent",
          transform: "rotate(-45deg)",
        }}
      />
    </span>
  );
}

export function Logo({
  size = 22,
  textSize = 19,
  muted = false,
  className,
}: {
  size?: number;
  textSize?: number;
  muted?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-[0.6em]", className)}>
      <LogoMark size={size} muted={muted} />
      <span
        className="font-semibold tracking-[-0.01em]"
        style={{ fontSize: textSize, color: muted ? "var(--color-muted)" : undefined }}
      >
        CodeReps
      </span>
    </span>
  );
}
