import { cn } from "../../lib/cn";

/** Loading is skeletons, never centered spinners (product principle). */
export function Skeleton({
  width,
  height = 12,
  className,
}: {
  width?: number | string;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("cr-skel rounded bg-raised", className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonLines({ widths }: { widths: (number | string)[] }) {
  return (
    <div className="flex flex-col gap-2.5 py-1" aria-hidden="true">
      {widths.map((w, i) => (
        <Skeleton key={i} width={typeof w === "number" ? `${w}%` : w} />
      ))}
    </div>
  );
}
