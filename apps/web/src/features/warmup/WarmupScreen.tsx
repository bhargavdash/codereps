import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { Button } from "../../components/ui/Button";
import { Skeleton } from "../../components/ui/Skeleton";
import { Check, Play } from "../../components/icons";
import { fmtClock } from "../../lib/format";
import { CATEGORY_LABEL } from "../../data/types";
import { useWarmup } from "./useWarmup";
import { useSummary } from "../../lib/useSummary";
import { track } from "../../lib/analytics";
import type { WarmupRepEntry } from "@codereps/shared";

/** Router state handed to the practice screen so it knows its place in the session. */
export interface WarmupNavState {
  warmup: { slugs: string[]; n: number };
}

type RepState = "done" | "now" | "todo";

const KIND_LABEL: Record<WarmupRepEntry["kind"], string> = {
  review: "REVIEW",
  "weak-spot": "WEAK SPOT",
  new: "NEW",
};
const KIND_COLOR: Record<WarmupRepEntry["kind"], string> = {
  review: "var(--color-muted)",
  "weak-spot": "var(--color-accent)",
  new: "var(--color-primary-mid)",
};

function StateBadge({ state }: { state: RepState }) {
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

function topicFromTags(tags: string[]): string {
  const tag = tags.find((t) => t !== "par-unverified");
  return tag ? tag.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";
}

function RepRow({ rep, state, navState }: { rep: WarmupRepEntry; state: RepState; navState: WarmupNavState }) {
  const isNow = state === "now";
  return (
    <Link
      to={`/practice/${rep.challenge.slug}`}
      state={navState}
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
            state === "done"
              ? { color: "var(--color-muted)", textDecoration: "line-through", textDecorationColor: "var(--color-faint)" }
              : { color: isNow ? "var(--color-ink-hi)" : "var(--color-ink)" }
          }
        >
          {rep.challenge.title}
        </span>
        <span className="text-[12.5px] text-muted">
          {CATEGORY_LABEL[rep.challenge.category]} · {topicFromTags(rep.challenge.tags)} · D{rep.challenge.difficulty}
        </span>
      </span>
      <span className="mono w-[62px] text-right text-[12.5px] text-muted">PAR {fmtClock(rep.challenge.parSeconds)}</span>
      <StateBadge state={state} />
    </Link>
  );
}

export function WarmupScreen() {
  const navigate = useNavigate();
  const { state, retry } = useWarmup();
  const summary = useSummary();
  const firstRun = summary !== null && summary.totals.totalReps === 0;

  const dateLabel =
    state.status === "ready"
      ? new Date(`${state.warmup.date}T00:00:00`).toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      : "";

  const reps = state.status === "ready" ? state.warmup.reps : [];
  const activeIdx = reps.findIndex((r) => !r.done);
  const allDone = state.status === "ready" && reps.length > 0 && activeIdx === -1;

  // once per browser per day — sessionStorage dedupes revisits of a done sheet
  const warmupDate = state.status === "ready" ? state.warmup.date : null;
  useEffect(() => {
    if (!allDone || !warmupDate) return;
    const key = `warmup_completed:${warmupDate}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    track("warmup_completed", { date: warmupDate });
  }, [allDone, warmupDate]);
  const estMinutes = Math.max(1, Math.ceil(reps.reduce((a, r) => a + r.challenge.parSeconds, 0) / 60));
  const navState: WarmupNavState = {
    warmup: { slugs: reps.map((r) => r.challenge.slug), n: Math.max(0, activeIdx) },
  };

  return (
    <AppShell>
      <div className="flex items-start justify-center px-10 py-[52px]">
        <div className="w-[780px] max-w-full overflow-hidden rounded-xl border border-border bg-surface-2 shadow-[0_24px_60px_-30px_oklch(0_0_0_/_0.7)]">
          <div className="h-1" style={{ background: allDone ? "var(--color-pass)" : "var(--color-primary)" }} />
          <div className="px-10 pb-9 pt-[34px]">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex flex-col gap-1.5">
                <h1 className="text-[27px] font-semibold tracking-[-0.015em]">Today&rsquo;s warmup</h1>
                <span className="text-sm text-muted">
                  {state.status === "ready" ? dateLabel : <Skeleton width={140} />}
                </span>
              </div>
              {state.status === "ready" && !allDone && (
                <span className="mono pt-1.5 text-[11.5px] tracking-[0.06em] text-muted-2">
                  ~{estMinutes} MIN AT PAR
                </span>
              )}
            </div>
            <p className="mb-7 text-[15px] leading-[1.55] text-muted">
              {firstRun ? (
                <>
                  <span className="text-ink-soft">Day 1.</span> Three short reps set your baseline —
                  the editor allows no autocomplete and no paste, and every rep is scored against a
                  par time. Your first fluency score lands after the first submit.
                </>
              ) : (
                <>
                  Three reps, same three all day. Reviews keep old patterns warm; new ones stretch
                  the range.
                </>
              )}
            </p>

            {state.status === "loading" ? (
              <div className="flex flex-col gap-6 border-t border-border pt-6" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-5">
                    <Skeleton width={16} />
                    <Skeleton width={70} />
                    <span className="flex-1">
                      <Skeleton width={`${55 - i * 10}%`} height={14} />
                    </span>
                    <Skeleton width={60} />
                  </div>
                ))}
              </div>
            ) : state.status === "error" ? (
              <div className="flex flex-col items-center gap-3 border-t border-border py-12 text-center" role="alert">
                <span className="text-[15px] font-medium text-ink">Couldn&rsquo;t load the session</span>
                <span className="text-[13px] text-muted">{state.message}</span>
                <Button variant="secondary" size="sm" offset="surface-2" onClick={retry}>
                  Try again
                </Button>
              </div>
            ) : (
              <div className="flex flex-col border-t border-border">
                {reps.map((rep, i) => (
                  <RepRow
                    key={rep.challenge.slug}
                    rep={rep}
                    state={rep.done ? "done" : i === activeIdx ? "now" : "todo"}
                    navState={{ warmup: { slugs: navState.warmup.slugs, n: i } }}
                  />
                ))}
              </div>
            )}

            {state.status === "ready" && (
              <div className="mt-8 flex items-center justify-between">
                {allDone ? (
                  <div className="flex items-center gap-3" style={{ color: "var(--color-pass)" }}>
                    <Check size={18} />
                    <span className="text-[15px] font-medium">
                      Session complete — {reps.length} reps logged.
                    </span>
                    <Link
                      to="/library"
                      className="ml-2 text-[13.5px] text-muted underline-offset-4 hover:text-ink hover:underline"
                    >
                      Keep going in the library
                    </Link>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    offset="surface-2"
                    onClick={() =>
                      navigate(`/practice/${reps[activeIdx]!.challenge.slug}`, { state: navState })
                    }
                    className="gap-2.5"
                  >
                    <Play size={15} />
                    {reps.some((r) => r.done)
                      ? `Resume — Rep ${activeIdx + 1} of ${reps.length}`
                      : "Start warmup"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
