import { Button } from "../../components/ui/Button";
import { Kbd } from "../../components/ui/Kbd";
import { Play } from "../../components/icons";
import { fmtClock, fmtFaults } from "../../lib/format";
import { CATEGORY_LABEL, type Challenge } from "../../data/types";

function StatRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="mono text-[11px] tracking-[0.08em] text-muted-2">{label}</span>
        {children}
      </div>
      <div className="h-px bg-border last:hidden" />
    </>
  );
}

export function SessionRail({
  challenge,
  elapsed,
  keystrokes,
  faults,
  over,
  barPct,
  editing,
  onRun,
  onSubmit,
  onAbandon,
  submitDisabled = false,
  submitting = false,
  abandonArmed = false,
}: {
  challenge: Challenge;
  elapsed: number;
  keystrokes: number;
  faults: number;
  over: boolean;
  barPct: number;
  editing: boolean;
  onRun: () => void;
  onSubmit: () => void;
  /** Present only when a server attempt exists — reveals the solution and ends the rep. */
  onAbandon?: () => void;
  submitDisabled?: boolean;
  submitting?: boolean;
  /** Two-beat abandon: first press arms, second confirms (irreversible action). */
  abandonArmed?: boolean;
}) {
  const dim = { opacity: editing ? 0.5 : 1 } as const;
  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-l border-border bg-surface xl:w-[284px]">
      {/* Timer — stays legible even while chrome recedes */}
      <div className="flex flex-col gap-1 border-b border-border px-[22px] pb-[22px] pt-6">
        <span className="mono text-[11px] tracking-[0.1em] text-muted-2">ELAPSED</span>
        <span
          className="mono text-[44px] font-medium leading-[1.05] tracking-[-0.01em] tabular-nums"
          style={{ color: over ? "var(--color-timeout)" : "var(--color-ink)" }}
          aria-label={`Elapsed ${fmtClock(elapsed)}`}
        >
          {fmtClock(elapsed)}
        </span>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="mono text-[13px] tracking-[0.02em] text-muted">
            PAR {fmtClock(challenge.parSeconds)}
          </span>
          <span className="mono text-[12px] text-muted-2">D{challenge.difficulty}</span>
        </div>
        <div className="mt-[7px] h-1 overflow-hidden rounded-full bg-[oklch(0.2_0.006_250)]">
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-linear"
            style={{
              width: `${barPct}%`,
              background: over ? "var(--color-timeout)" : "var(--color-primary)",
            }}
          />
        </div>
      </div>

      {/* Session stats — recede while typing */}
      <div
        className="flex flex-col gap-[15px] px-[22px] py-5 transition-opacity duration-200"
        style={dim}
      >
        <StatRow label="CATEGORY">
          <span className="text-[13px] text-ink-soft">
            {CATEGORY_LABEL[challenge.category]} · {challenge.topic}
          </span>
        </StatRow>
        <StatRow label="KEYSTROKES">
          <span className="mono text-[15px] text-ink">{keystrokes}</span>
        </StatRow>
        <StatRow label="FAULTS">
          <span
            className="mono text-[15px] tracking-[0.04em]"
            style={{ color: faults > 0 ? "var(--color-accent)" : "var(--color-muted)" }}
          >
            {fmtFaults(faults)}
          </span>
        </StatRow>
      </div>

      <div className="flex-1" />

      <div
        className="flex flex-col gap-2.5 border-t border-border px-[22px] py-5 transition-opacity duration-200"
        style={dim}
      >
        <Button variant="secondary" size="md" offset="surface" onClick={onRun} className="w-full py-[11px]">
          <Play size={12} />
          Run tests
        </Button>
        <Button
          variant="primary"
          size="md"
          offset="surface"
          onClick={onSubmit}
          disabled={submitDisabled}
          loading={submitting}
          className="w-full py-[11px]"
        >
          Submit rep
        </Button>
        <div className="mt-0.5 flex items-center justify-center gap-3">
          <Kbd className="text-muted-2">⌘↵ submit</Kbd>
          <Kbd className="text-muted-2">⌘R run</Kbd>
        </div>
        {onAbandon && (
          <button
            type="button"
            onClick={onAbandon}
            className="mt-1 w-full rounded py-1 text-center text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            style={{ color: abandonArmed ? "var(--color-fail)" : "var(--color-muted-2)" }}
          >
            {abandonArmed ? "Press again — this ends the rep" : "Show solution (ends the rep)"}
          </button>
        )}
      </div>
    </aside>
  );
}
