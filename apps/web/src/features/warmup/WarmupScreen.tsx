import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/Button";
import { Check, Play } from "../../components/icons";
import { fmtClock } from "../../lib/format";
import { WARMUP } from "../../data/app-data";
import type { WarmupRep } from "../../data/types";

const KIND_LABEL: Record<WarmupRep["kind"], string> = {
  review: "REVIEW",
  "weak-spot": "WEAK SPOT",
  new: "NEW",
};
const KIND_COLOR: Record<WarmupRep["kind"], string> = {
  review: "var(--color-muted)",
  "weak-spot": "var(--color-accent)",
  new: "var(--color-primary-mid)",
};

function StateBadge({ state }: { state: WarmupRep["state"] }) {
  if (state === "done")
    return (
      <span className="flex w-[84px] items-center justify-end gap-1.5" style={{ color: "var(--color-pass)" }}>
        <Check size={14} />
        <span className="mono text-[12px]">DONE</span>
      </span>
    );
  if (state === "now")
    return (
      <span className="flex w-[84px] items-center justify-end gap-1.5" style={{ color: "var(--color-primary-mid)" }}>
        <span className="size-2 rounded-full bg-primary" />
        <span className="mono text-[12px]">NOW</span>
      </span>
    );
  return (
    <span className="flex w-[84px] items-center justify-end gap-1.5 text-muted-2">
      <span className="size-3 rounded-full border-[1.5px] border-faint" />
      <span className="mono text-[12px]">TO DO</span>
    </span>
  );
}

function RepRow({ rep }: { rep: WarmupRep }) {
  const to = rep.state === "done" ? `/practice/${rep.slug}/debrief` : `/practice/${rep.slug}`;
  const isNow = rep.state === "now";
  return (
    <Link
      to={to}
      className={
        "group flex items-center gap-5 rounded-md px-1 py-5 transition-colors " +
        "[&:not(:last-child)]:border-b [&:not(:last-child)]:border-border " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2 " +
        (isNow ? "-mx-2 bg-[oklch(0.65_0.16_250_/_0.05)] px-3" : "hover:bg-[oklch(0.18_0.006_250_/_0.4)]")
      }
    >
      <span className="mono w-4 text-[12px]" style={{ color: isNow ? "var(--color-muted)" : "var(--color-muted-2)" }}>
        {rep.n}
      </span>
      <span
        className="mono w-[90px] shrink-0 text-[10.5px] tracking-[0.06em]"
        style={{ color: KIND_COLOR[rep.kind] }}
      >
        {KIND_LABEL[rep.kind]}
      </span>
      <span className="flex flex-1 flex-col gap-[3px]">
        <span
          className="text-[15.5px] font-medium"
          style={
            rep.state === "done"
              ? { color: "var(--color-muted)", textDecoration: "line-through", textDecorationColor: "var(--color-faint)" }
              : { color: isNow ? "var(--color-ink-hi)" : "var(--color-ink)" }
          }
        >
          {rep.title}
        </span>
        <span className="text-[12.5px] text-muted">{rep.subtitle}</span>
      </span>
      <span className="mono w-[62px] text-right text-[12.5px] text-muted">PAR {fmtClock(rep.parSeconds)}</span>
      <StateBadge state={rep.state} />
    </Link>
  );
}

export function WarmupScreen() {
  const navigate = useNavigate();
  const activeRep = WARMUP.reps.find((r) => r.slug === WARMUP.activeSlug);
  return (
    <AppShell>
      <div className="flex items-start justify-center px-10 py-[52px]">
        <div className="w-[780px] max-w-full overflow-hidden rounded-xl border border-border bg-surface-2 shadow-[0_24px_60px_-30px_oklch(0_0_0_/_0.7)]">
          <div className="h-1 bg-primary" />
          <div className="px-10 pb-9 pt-[34px]">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex flex-col gap-1.5">
                <h1 className="text-[27px] font-semibold tracking-[-0.015em]">Today&rsquo;s warmup</h1>
                <span className="text-sm text-muted">{WARMUP.dateLabel}</span>
              </div>
              <span className="mono pt-1.5 text-[11.5px] tracking-[0.06em] text-muted-2">
                SESSION {WARMUP.session} · ~{WARMUP.estMinutes} MIN
              </span>
            </div>
            <p className="mb-7 text-[15px] leading-[1.55] text-muted">
              Three reps: one you know, one that&rsquo;s slipping, one you&rsquo;ve never done. Same shape
              every morning.
            </p>

            <div className="flex flex-col border-t border-border">
              {WARMUP.reps.map((rep) => (
                <RepRow key={rep.n} rep={rep} />
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="primary"
                size="lg"
                offset="surface-2"
                onClick={() => navigate(`/practice/${WARMUP.activeSlug}`)}
                className="gap-2.5"
              >
                <Play size={15} />
                Resume — Rep {activeRep?.n} of {WARMUP.reps.length}
              </Button>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="md" className="text-[13.5px] text-muted hover:text-ink">
                  Rebuild session
                </Button>
                <Button variant="ghost" size="md" className="text-[13.5px] text-muted-2 hover:text-ink">
                  Skip today
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
