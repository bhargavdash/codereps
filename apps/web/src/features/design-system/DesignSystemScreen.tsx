import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../../components/ui/Logo";
import { Button } from "../../components/ui/Button";
import { VerdictPill } from "../../components/ui/VerdictPill";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { RepDots } from "../../components/ui/RepDots";
import { Input } from "../../components/ui/Input";
import { SkeletonLines } from "../../components/ui/Skeleton";

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="text-subhead font-medium">{title}</h2>
        <span className="mono text-[12px] text-muted-2">{note}</span>
      </div>
      {children}
    </section>
  );
}

function Swatch({ bg, name, value, note, bordered }: { bg: string; name: string; value: string; note: string; bordered?: boolean }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div
        className="h-[72px] rounded-[7px]"
        style={{ background: bg, border: bordered ? "1px solid var(--color-border-2)" : undefined }}
      />
      <div className="flex flex-col gap-px">
        <span className="text-[13px] font-medium">{name}</span>
        <span className="mono text-[11px] text-muted">{value}</span>
        <span className="text-[11px] text-muted-2">{note}</span>
      </div>
    </div>
  );
}

const surfaces = [
  { bg: "var(--color-bg)", name: "bg", value: "0.10 0 0", note: "iron black", bordered: true },
  { bg: "var(--color-surface)", name: "surface", value: "0.145 .004 250", note: "panels, rail", bordered: true },
  { bg: "var(--color-raised)", name: "raised", value: "0.18 .006 250", note: "gutter, hover", bordered: true },
  { bg: "var(--color-ink)", name: "ink", value: "0.93 .005 250", note: "body text" },
  { bg: "var(--color-muted)", name: "muted", value: "0.65 .01 250", note: "secondary" },
];
const signals = [
  { bg: "var(--color-primary)", name: "primary", value: "0.65 .16 250", note: "cobalt · signal" },
  { bg: "var(--color-accent)", name: "accent", value: "0.84 .13 85", note: "chalk amber" },
  { bg: "var(--color-pass)", name: "pass", value: "0.72 .15 150", note: "verdict pass" },
  { bg: "var(--color-fail)", name: "fail", value: "0.62 .19 25", note: "verdict fail" },
  { bg: "var(--color-timeout)", name: "timeout", value: "0.75 .14 85", note: "over par" },
];
const typeScale = [
  { label: "Timer", size: 40, weight: 600, spec: "display · 2.5rem / 40px", mono: true },
  { label: "Verdict line", size: 33, weight: 600, spec: "display-sm · 2.06rem / 33px" },
  { label: "Section heading", size: 23, weight: 600, spec: "heading · 1.44rem / 23px" },
  { label: "Subhead", size: 19, weight: 500, spec: "subhead · 1.2rem / 19px" },
  { label: "Body copy — the prompt, the reading surface.", size: 16, weight: 400, spec: "body · 1rem / 16px" },
  { label: "Caption & meta labels", size: 13, weight: 400, spec: "small · 0.83rem / 13px" },
];
const spacing = [4, 8, 12, 16, 24, 32, 48, 64];
const heatRamp = [0, 1, 2, 3, 4];

export function DesignSystemScreen() {
  const [seg, setSeg] = useState("all");
  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-border px-10 py-5">
        <Logo size={22} textSize={19} />
        <div className="flex items-center gap-4">
          <span className="mono text-[13px] text-muted-2">design system · dark · reference</span>
          <Link
            to="/"
            className="text-[13px] text-muted transition-colors hover:text-ink"
          >
            ← Home
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1180px] flex-col gap-12 px-10 py-12">
        <div className="flex max-w-[760px] flex-col gap-2">
          <h1 className="text-[33px] font-semibold leading-[1.1] tracking-[-0.02em]">The instrument kit</h1>
          <p className="text-base leading-[1.55] text-muted">
            Precision equipment for training code fluency. Calm, exact, dark-only. Every metric reads
            like a timing device — JetBrains&nbsp;Mono, tabular figures. Cobalt is the only signal
            color; chalk-amber is rarer still.
          </p>
        </div>

        <Section title="Color" note="OKLCH only · no hex">
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-5 gap-4">
              {surfaces.map((s) => (
                <Swatch key={s.name} {...s} />
              ))}
            </div>
            <div className="grid grid-cols-5 gap-4">
              {signals.map((s) => (
                <Swatch key={s.name} {...s} />
              ))}
            </div>
            <div className="flex items-center gap-5 pt-1">
              <div className="flex flex-col gap-2">
                <span className="text-[13px] font-medium">Heatmap ramp</span>
                <span className="max-w-[200px] text-[12px] leading-[1.4] text-muted-2">
                  5 cobalt steps — surface toward primary. Explicitly not GitHub green.
                </span>
              </div>
              <div className="flex gap-1.5">
                {heatRamp.map((l) => (
                  <span
                    key={l}
                    className="size-[46px] rounded-[5px]"
                    style={{
                      background: `var(--color-heat-${l})`,
                      border: l === 0 ? "1px solid var(--color-border-2)" : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section title="Type" note="IBM Plex Sans · JetBrains Mono · ratio 1.2">
          <div className="grid grid-cols-2 gap-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-baseline gap-3">
                <span className="text-[28px] font-semibold tracking-[-0.01em]">IBM Plex Sans</span>
                <span className="mono text-[11px] text-muted-2">UI · 400 500 600</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-base">Regular — implement it from memory, no autocomplete.</span>
                <span className="text-base font-medium">Medium — labels, buttons, active states.</span>
                <span className="text-base font-semibold">Semibold — verdicts and headings.</span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-baseline gap-3">
                <span className="mono text-[28px] font-medium">JetBrains Mono</span>
                <span className="mono text-[11px] text-muted-2">code + all numerals</span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="mono text-[20px] tracking-[0.02em]">0 1 2 3 4 5 6 7 8 9</span>
                <div className="flex items-baseline gap-4">
                  <span className="mono text-[20px] text-ink">3:07</span>
                  <span className="mono text-[20px]" style={{ color: "var(--color-pass)" }}>−0:24</span>
                  <span className="mono text-[20px]" style={{ color: "var(--color-accent)" }}>88</span>
                  <span className="mono text-[20px] text-muted">FAULTS&nbsp;00</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col overflow-hidden rounded-lg border border-border">
            {typeScale.map((t, i) => (
              <div
                key={t.label}
                className="flex items-baseline gap-5 px-5 py-3.5"
                style={i % 2 ? { background: "var(--color-well)" } : undefined}
              >
                <span
                  className={"flex-1 leading-none " + (t.mono ? "mono" : "")}
                  style={{ fontSize: t.size, fontWeight: t.weight, color: t.size <= 13 ? "var(--color-muted)" : undefined }}
                >
                  {t.label}
                </span>
                <span className="mono w-[210px] text-[12px] text-muted-2">{t.spec}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Spacing" note="4px base · fixed rem">
          <div className="flex items-end gap-[22px]">
            {spacing.map((s) => (
              <div key={s} className="flex flex-col items-start gap-2">
                <span className="rounded-[2px] bg-primary" style={{ width: s, height: s }} />
                <span className="mono text-[11px] text-muted">{s}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Components" note="6px radius · one shape family · focus ring 2px cobalt">
          <div className="grid grid-cols-2 gap-x-10 gap-y-8">
            <div className="flex flex-col gap-3.5">
              <span className="mono text-[11px] tracking-[0.06em] text-muted-2">PRIMARY · SUBMIT</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Submit</Button>
                <Button variant="primary" disabled>Submit</Button>
                <Button variant="primary" loading>Submitting</Button>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <span className="mono text-[11px] tracking-[0.06em] text-muted-2">SECONDARY · RUN &amp; GHOST</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary">Run</Button>
                <Button variant="ghost">Skip rep</Button>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <span className="mono text-[11px] tracking-[0.06em] text-muted-2">VERDICT · ICON + WORD ALWAYS</span>
              <div className="flex flex-wrap items-center gap-3">
                <VerdictPill verdict="pass" />
                <VerdictPill verdict="fail" />
                <VerdictPill verdict="timeout" />
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-4">
                <span className="mono text-[13px] tracking-[0.04em] text-muted">FAULTS 00</span>
                <span className="mono text-[13px] tracking-[0.04em]" style={{ color: "var(--color-accent)" }}>FAULTS 03</span>
                <span
                  className="cr-pr mono inline-flex items-center justify-center rounded-md px-2.5 py-[5px] text-[13px] font-bold tracking-[0.14em]"
                  style={{ border: "1.5px solid var(--color-accent)", color: "var(--color-accent)", transform: "rotate(-4deg)" }}
                >
                  PR
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <span className="mono text-[11px] tracking-[0.06em] text-muted-2">SEGMENTED · DIFFICULTY</span>
              <SegmentedControl
                aria-label="Demo filter"
                options={[
                  { value: "all", label: "All" },
                  { value: "react", label: "React" },
                  { value: "ts", label: "TS" },
                  { value: "algo", label: "Algo" },
                ]}
                value={seg}
                onChange={setSeg}
              />
              <div className="mt-1 flex items-center gap-4">
                <RepDots level={1} showLabel />
                <RepDots level={3} showLabel />
                <RepDots level={5} showLabel />
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <span className="mono text-[11px] tracking-[0.06em] text-muted-2">INPUT · SEARCH</span>
              <Input defaultValue="debounce" />
              <Input defaultValue="deboonce" error="No challenge matches that name." />
            </div>

            <div className="flex flex-col gap-3.5">
              <span className="mono text-[11px] tracking-[0.06em] text-muted-2">LOADING · SKELETON (NO SPINNERS)</span>
              <SkeletonLines widths={[60, 90, 78]} />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
