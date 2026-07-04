import { cn } from "../../lib/cn";

/** A keyboard hint — this is a keyboard-first tool, so shortcuts are shown. */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("mono text-[11px] text-muted-2", className)}>{children}</span>
  );
}
