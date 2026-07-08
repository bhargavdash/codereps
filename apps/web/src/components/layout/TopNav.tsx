import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/cn";
import { Logo } from "../ui/Logo";
import { StreakBadge } from "../ui/StreakBadge";
import { AccountMenu } from "./AccountMenu";
import { streakAtRisk, useSummary } from "../../lib/useSummary";

// mock-era "Practice" tab removed with S4-4: reps are entered from the
// warmup sheet or the library, and the practice screen has its own chrome
const tabs = [
  { label: "Warmup", to: "/warmup", match: "/warmup" },
  { label: "Log", to: "/log", match: "/log" },
  { label: "Library", to: "/library", match: "/library" },
];

export function TopNav() {
  const { pathname } = useLocation();
  const summary = useSummary();
  return (
    <header
      className="sticky top-0 flex h-14 shrink-0 items-center justify-between border-b border-border bg-bg px-7"
      style={{ zIndex: "var(--z-sticky)" as unknown as number }}
    >
      <div className="flex items-center gap-7">
        <Link to="/" className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-bg">
          <Logo size={19} textSize={15} />
        </Link>
        <nav className="flex h-14 items-center gap-1" aria-label="Primary">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.match);
            return (
              <Link
                key={tab.label}
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex h-14 items-center border-b-2 px-3.5 text-[13.5px] transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                  active
                    ? "border-primary font-medium text-ink"
                    : "border-transparent text-muted hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {summary && (
          <StreakBadge
            days={summary.streak.current}
            alive={summary.streak.qualifiedToday}
            atRisk={streakAtRisk(summary)}
          />
        )}
        <AccountMenu />
      </div>
    </header>
  );
}
