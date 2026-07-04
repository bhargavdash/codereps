import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { TopNav } from "./TopNav";

/** Frame for the browse surfaces (Warmup, Log, Library) — top nav + content. */
export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <TopNav />
      <main className={cn("flex-1", className)}>{children}</main>
    </div>
  );
}

/** Constrains content width and pads it — dense tables can opt out with a wider max. */
export function Container({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "default" | "wide";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-8",
        size === "wide" ? "max-w-[1320px]" : "max-w-[1180px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
