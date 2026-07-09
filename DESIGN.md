---
name: CodeReps
description: An athletic timing instrument for training code fluency — dark-only, cobalt signal, every numeral a stopwatch readout.
colors:
  bg: "oklch(0.10 0 0)"
  surface: "oklch(0.145 0.004 250)"
  surface-2: "oklch(0.128 0.004 250)"
  editor: "oklch(0.112 0.003 250)"
  raised: "oklch(0.18 0.006 250)"
  line: "oklch(0.165 0.006 250)"
  ink: "oklch(0.93 0.005 250)"
  ink-soft: "oklch(0.86 0.005 250)"
  muted: "oklch(0.65 0.01 250)"
  muted-2: "oklch(0.62 0.01 250)"
  faint: "oklch(0.58 0.01 250)"
  primary: "oklch(0.65 0.16 250)"
  primary-hi: "oklch(0.70 0.16 250)"
  primary-lo: "oklch(0.59 0.15 250)"
  primary-mid: "oklch(0.70 0.14 250)"
  on-primary: "oklch(0.98 0.005 250)"
  accent: "oklch(0.84 0.13 85)"
  ink-hi: "oklch(0.95 0.005 250)"
  ink-dim: "oklch(0.78 0.005 250)"
  ink-mute: "oklch(0.72 0.02 250)"
  dot-on: "oklch(0.88 0.02 250)"
  dot-off: "oklch(0.30 0.01 250)"
  avatar-bg: "oklch(0.22 0.02 250)"
  avatar-border: "oklch(0.30 0.02 250)"
  avatar-ink: "oklch(0.80 0.02 250)"
  pass: "oklch(0.72 0.15 150)"
  fail: "oklch(0.62 0.19 25)"
  timeout: "oklch(0.75 0.14 85)"
  border: "oklch(0.18 0.006 250)"
  border-2: "oklch(0.24 0.006 250)"
typography:
  display:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "2.5rem"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.01em"
    fontFeature: "tnum, ss01"
  headline:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.4375rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  title:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 500
    lineHeight: 1.2
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.08em"
    fontFeature: "tnum"
rounded:
  sm: "5px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hi}"
    textColor: "{colors.on-primary}"
  button-primary-active:
    backgroundColor: "{colors.primary-lo}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  verdict-pass:
    textColor: "{colors.pass}"
    rounded: "{rounded.md}"
    padding: "7px 12px"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "9px 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: CodeReps

## 1. Overview

**Creative North Star: "The Timing Instrument"**

CodeReps looks like equipment made by people who build race-timing hardware — a stopwatch hanging in a boxing gym at 6am, a training logbook with chalk dust on it. It is not a terminal and it is not a SaaS dashboard. Every surface is calm, exact, and quietly serious; the only lit thing in a dark room while a developer does fifteen minutes of reps before bed. Motivation comes from honest numbers, never from confetti.

The system runs on two materials: **iron-black neutrals** for the instrument body, and **cobalt** as the single signal color that marks anything live, selected, or measured. A rarer **chalk-amber** is reserved for the emotional beats — a streak flame, a personal record, a category that's decaying. Restraint is the whole point: when almost nothing is colored, the one thing that is colored means something.

What this system explicitly rejects: terminal-green-on-black cosplay, purple "AI product" gradients, glassmorphism, identical icon-card grids, hero-metric stat rows, and the tiny uppercase eyebrow stamped above every section. Familiar affordances (a Linear/Raycast user trusts every control instantly), unfamiliar identity (no dev tool reads like athletic timing gear).

**Key Characteristics:**
- Dark-only, by deliberate scene choice — not a default.
- Every numeral is JetBrains Mono with tabular figures: timers, pars, splits, scores, streaks read like hardware.
- Cobalt ≤ signal only; chalk-amber rarer still. Restrained color strategy.
- The editor is the hero — during a rep, all chrome recedes to ~50%.
- Motion conveys state only: splits land, a PR stamp settles, digits tick.

## 2. Colors

A near-neutral iron ramp carries the entire instrument body; a single cobalt and a single amber carry all meaning.

### Primary
- **Cobalt** (`oklch(0.65 0.16 250)`): The instrument signal. Primary buttons, the active tab underline, the current selection, focus rings, live progress bars, and every data element (heatmap peak, readiness sparklines that are rising). White text (`oklch(0.98 0.005 250)`) on any cobalt fill. Hover lightens to `oklch(0.70 0.16 250)`, active darkens to `oklch(0.59 0.15 250)`.

### Secondary
- **Chalk Amber** (`oklch(0.84 0.13 85)`): The rare emotional accent — streak flame when alive, the "PR" stamp, "NEEDS WORK" / "at-risk" states, and a decaying sparkline. Never decorative; if amber appears, something is either celebrated or slipping.

### Tertiary
- **Verdict Pass** (`oklch(0.72 0.15 150)`), **Verdict Fail** (`oklch(0.62 0.19 25)`), **Timeout** (`oklch(0.75 0.14 85)`): Result semantics only, always paired with an icon and a word — never color-alone.

### Neutral
- **Iron Black** (`oklch(0.10 0 0)`): The body background, pure chroma-0.
- **Surface** (`oklch(0.145 0.004 250)`) / **Surface-2** (`oklch(0.128 0.004 250)`) / **Editor** (`oklch(0.112 0.003 250)`): Panels, session rail, prompt panel, and the editor field — a faintly cobalt-tinted tonal stack, never warm.
- **Raised** (`oklch(0.18 0.006 250)`): Hover fills, gutters, chips.
- **Ink** (`oklch(0.93 0.005 250)`) / **Ink-soft** (`oklch(0.86 0.005 250)`): Body text and reading copy.
- **Muted** (`oklch(0.65 0.01 250)`) / **Muted-2** (`oklch(0.62 0.01 250)`) / **Faint** (`oklch(0.58 0.01 250)`): Secondary text, mono meta-labels, and empty/tertiary states. Muted is never used for primary body copy. Muted-2 and Faint were raised from their original 0.55/0.45 lightness (S6-4) to clear WCAG AA 4.5:1 at the 9-13px sizes they actually ship at.
- **Border** (`oklch(0.18 0.006 250)`) / **Border-2** (`oklch(0.24 0.006 250)`): Hairline dividers and stronger chip strokes.

### Named Rules
**The One Signal Rule.** Cobalt marks what is live, selected, or measured — nothing else. If cobalt appears as decoration, it's wrong; recolor it neutral.

**The Amber Scarcity Rule.** Chalk-amber is rarer than cobalt. It appears only on streaks, personal records, and decay/at-risk states. A screen with amber everywhere has lost the plot.

**The Cobalt-Heatmap Rule.** The activity heatmap ramps from surface up to cobalt in five steps. It is explicitly not GitHub green — green is a verdict color here, never a quantity.

## 3. Typography

**Display Font:** JetBrains Mono (with ui-monospace, monospace)
**Body Font:** IBM Plex Sans (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (tabular figures, `tnum` + `ss01`)

**Character:** A contrast pairing on the mono-vs-sans axis. Plex Sans is the calm instrument-panel UI voice (400/500/600 only); JetBrains Mono is the readout glass — it carries all code and, distinctively, every single numeral in the product.

### Hierarchy
- **Display / Timer** (JetBrains Mono, 500, 2.5rem / 40px, line-height 1.05): The elapsed timer and the debrief verdict time — the biggest type on the practice screen, instrument digits rather than a hero banner.
- **Headline** (Plex Sans, 600, 1.4375rem / 23px): Section and screen headings.
- **Title** (Plex Sans, 500, 1.1875rem / 19px): Subheads, panel titles.
- **Body** (Plex Sans, 400, 1rem / 16px, line-height 1.55): Prompts and reading copy; capped 65–75ch.
- **Label** (JetBrains Mono, 400, 0.6875rem / 11px, letter-spacing 0.08em, uppercase): Meta-labels — ELAPSED, KEYSTROKES, FAULTS, category headers.

### Named Rules
**The Mono-Numeral Rule.** Every number in the product — timers, par deltas, fluency scores, streaks, test durations, keystroke counts — is JetBrains Mono with tabular figures. Numbers are readouts; they stay column-aligned like a timing device. A number set in the sans font is a bug.

**The Fixed-Scale Rule.** Type sizes are a fixed rem scale at ratio ~1.2. No fluid `clamp()` in product UI; a heading that shrinks inside a sidebar looks worse, not better. (The brand landing page is the one exception where a hero may use `clamp()`.)

## 4. Elevation

Flat by default. Depth is conveyed almost entirely by the tonal neutral stack (bg → surface-2 → surface → raised) and hairline borders, not by shadows. The system is a lit panel in a dark room; drop-shadows on dark read as smudges.

### Shadow Vocabulary
- **Floating sheet** (`box-shadow: 0 24px 60px -30px oklch(0 0 0 / 0.7)`): The warmup session card and the landing hero artifact only — a single soft lift to say "this is the object in focus." Used sparingly.

### Named Rules
**The Tonal-Depth Rule.** Layering is expressed by stepping the neutral ramp and adding a 1px border, never by stacking shadows. Shadow is reserved for one or two genuinely floating objects per app.

## 5. Components

### Buttons
- **Shape:** One family, gently squared (6px radius). No pill-vs-square mixing anywhere.
- **Primary:** Cobalt fill, white text, `10px 18px` padding. Hover `primary-hi`, active `primary-lo`; disabled drops to raised with muted text. Loading shows an inline ring spinner and keeps the label.
- **Secondary:** Raised fill with a `border-2` stroke, ink text — for "Run tests" and other non-committal actions.
- **Ghost:** Transparent, muted text, raised hover fill — for "Skip rep", tertiary nav.
- **Focus:** 2px cobalt ring offset by the surface behind the control (keyboard-first product; the ring must be visible on dark).

### Chips / Pills
- **Tag chip:** Raised fill, `border-2` stroke, 5px radius, small ink-soft text — language/topic tags.
- **Verdict pill:** Icon + WORD always, tinted background (verdict color at ~14% alpha) with a matching border at ~40% and the verdict color as text. Never color-alone.
- **Off chip:** `AI OFF` / `PASTE OFF` — a muted dot + mono label in a hairline stroke; the product's refusal, worn openly.

### Cards / Containers
- **Corner Style:** 8–12px radius (lg/xl).
- **Background:** Surface or surface-2 over the iron-black canvas.
- **Shadow Strategy:** Flat; see Elevation. The warmup sheet is the rare lifted object.
- **Border:** 1px `border`. Nested cards are forbidden.
- **Internal Padding:** 20–24px.

### Inputs / Fields
- **Style:** Surface-2 fill, `border-2` stroke, 6px radius, `9px 12px` padding; optional leading icon (search).
- **Focus:** Border shifts to cobalt with a soft cobalt ring (`primary / 30%`). No glow.
- **Error:** Fail-red border with an icon + message beneath. Placeholder text meets the same 4.5:1 contrast floor as body — never a faint gray.

### Navigation
- **Top bar:** 56px, hairline bottom border. Wordmark + text tabs (Warmup / Practice / Log / Library) on the left; streak badge + avatar on the right.
- **States:** Active tab is ink with a 2px cobalt underline flush to the bar's bottom edge; inactive tabs are muted, hover to ink.

### Signature Component — The Session Rail & Editor
The practice screen is three zones: a collapsible **prompt panel** (words only, never code), the **editor** (CodeMirror, largest surface, syntax-highlit on dark), and a narrow **session rail** (timer counting up, PAR beneath, keystrokes, a paste-attempt "FAULTS" counter). **The Recede Rule:** the instant the editor is focused, top bar / prompt / rail-stats / action buttons drop to ~50% opacity — but the timer stays fully legible. Nothing competes with the code while a rep is in progress.

## 6. Do's and Don'ts

### Do:
- **Do** set every numeral in JetBrains Mono tabular figures — timers, pars, splits, scores, streaks, durations.
- **Do** keep cobalt to signal (live / selected / measured) and chalk-amber to streaks, PRs, and decay only.
- **Do** pair every pass/fail/timeout with an icon **and** a word; color is never the only cue.
- **Do** recede all chrome to ~50% while the editor is focused; keep the timer legible.
- **Do** use skeletons for loading and empty states that teach ("Your heatmap starts today"), not centered spinners.
- **Do** give every animation a `prefers-reduced-motion` alternative, and keep the default state visible so a reveal never ships blank.
- **Do** keep one button shape family (6px) and a 2px cobalt focus ring visible on dark.

### Don't:
- **Don't** do terminal-green-on-black cosplay or purple-gradient "AI product" theming.
- **Don't** use gradient text (`background-clip: text`) — emphasis is weight, size, or a single solid color.
- **Don't** use glassmorphism / decorative blur, or `border-left` colored side-stripes on cards or alerts.
- **Don't** ship the hero-metric template (big number, small label, ×4 grid) or identical icon+heading+text card grids.
- **Don't** stamp a tiny uppercase tracked eyebrow above every section, or numbered `01 / 02 / 03` section markers as decoration.
- **Don't** color the activity heatmap green — it ramps in cobalt; green is a verdict, not a quantity.
- **Don't** reach for cream/sand/warm neutrals or a light theme — CodeReps is iron-black by scene, not by default.
- **Don't** reinvent scrollbars or form controls, or set any number in the sans font.
