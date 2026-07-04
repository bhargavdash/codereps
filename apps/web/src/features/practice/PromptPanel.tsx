import { Fragment } from "react";
import { ChevronLeft, ChevronRight, Lock } from "../../components/icons";
import { RepDots } from "../../components/ui/RepDots";
import { CATEGORY_LABEL, type Challenge } from "../../data/types";

/** Render text with `backtick` spans as mono inline code. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <span key={i} className="mono text-[0.92em] text-[oklch(0.88_0.02_250)]">
            {part.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono text-[11px] tracking-[0.08em] text-muted-2">{children}</span>
  );
}

export function PromptPanel({
  challenge,
  open,
  onToggle,
  dim,
}: {
  challenge: Challenge;
  open: boolean;
  onToggle: () => void;
  dim: boolean;
}) {
  if (!open) {
    return (
      <aside className="flex w-[46px] shrink-0 flex-col items-center gap-4 border-r border-border bg-surface-2 py-3.5">
        <button
          onClick={onToggle}
          aria-label="Expand prompt"
          className="flex rounded-md border border-border-2 bg-raised p-1.5 text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ChevronRight size={14} />
        </button>
        <div
          className="mt-1 flex items-center gap-3"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          <span className="text-[13px] font-semibold tracking-[0.02em] text-[oklch(0.72_0.01_250)]">
            {challenge.title}
          </span>
          <span className="mono text-[11px] tracking-[0.1em] text-muted-2">PROMPT</span>
        </div>
        <div className="flex-1" />
        <div className="flex flex-col gap-1">
          <RepDots level={challenge.difficulty} size={6} />
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="flex w-[336px] shrink-0 flex-col border-r border-border bg-surface-2 transition-opacity duration-200"
      style={{ opacity: dim ? 0.5 : 1 }}
    >
      <div className="flex flex-col gap-3.5 border-b border-border px-[22px] pb-[18px] pt-[22px]">
        <div className="flex items-center justify-between">
          <h1 className="text-[21px] font-semibold tracking-[-0.01em]">{challenge.title}</h1>
          <button
            onClick={onToggle}
            aria-label="Collapse prompt"
            className="flex rounded p-1 text-muted-2 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[5px] border border-border-2 bg-raised px-[9px] py-[3px] text-[12px] text-[oklch(0.82_0.02_250)]">
            {CATEGORY_LABEL[challenge.category]}
          </span>
          <span className="rounded-[5px] border border-border-2 bg-raised px-[9px] py-[3px] text-[12px] text-[oklch(0.82_0.02_250)]">
            {challenge.topic}
          </span>
          <RepDots level={challenge.difficulty} size={7} showLabel className="ml-0.5" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-[22px] overflow-auto px-[22px] py-5">
        <p className="text-[14.5px] leading-[1.62] text-ink-soft">{challenge.prompt}</p>

        <div className="flex flex-col gap-[11px]">
          <Label>REQUIREMENTS</Label>
          {challenge.requirements.map((req, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span
                className="mt-[7px] size-[5px] shrink-0 rotate-45 bg-primary"
                aria-hidden="true"
              />
              <span className="text-[13.5px] leading-[1.5] text-[oklch(0.82_0.005_250)]">
                <Inline text={req} />
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <Label>BEHAVES LIKE</Label>
          <p className="text-[13px] leading-[1.55] text-muted">
            <Inline text={challenge.behavesLike} />
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border bg-well px-[22px] py-[13px]">
        <Lock size={13} style={{ color: "var(--color-muted-2)" }} />
        <span className="mono whitespace-nowrap text-[10.5px] text-muted-2">
          No libraries · No autocomplete · No paste
        </span>
      </div>
    </aside>
  );
}
