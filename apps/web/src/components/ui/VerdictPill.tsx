import { cn } from "../../lib/cn";
import { Check, Cross, ClockAlert } from "../icons";

export type Verdict = "pass" | "fail" | "timeout";

const config: Record<
  Verdict,
  { label: string; text: string; bg: string; border: string; Icon: typeof Check }
> = {
  pass: {
    label: "PASS",
    text: "oklch(0.78 0.15 150)",
    bg: "oklch(0.72 0.15 150 / 0.14)",
    border: "oklch(0.72 0.15 150 / 0.4)",
    Icon: Check,
  },
  fail: {
    label: "FAIL",
    text: "oklch(0.72 0.18 25)",
    bg: "oklch(0.62 0.19 25 / 0.14)",
    border: "oklch(0.62 0.19 25 / 0.42)",
    Icon: Cross,
  },
  timeout: {
    label: "TIMEOUT",
    text: "oklch(0.82 0.13 85)",
    bg: "oklch(0.75 0.14 85 / 0.14)",
    border: "oklch(0.75 0.14 85 / 0.42)",
    Icon: ClockAlert,
  },
};

/** Verdict is never color-alone — always icon + word (WCAG, colour-blind). */
export function VerdictPill({ verdict, className }: { verdict: Verdict; className?: string }) {
  const c = config[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[7px] rounded-md px-3 py-[7px] text-[13px] font-medium",
        className,
      )}
      style={{ color: c.text, background: c.bg, border: `1px solid ${c.border}` }}
    >
      <c.Icon size={14} />
      {c.label}
    </span>
  );
}
