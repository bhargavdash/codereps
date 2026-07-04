---
target: apps/web CodeReps
total_score: 34
p0_count: 0
p1_count: 1
timestamp: 2026-07-03T17-06-47Z
slug: apps-web-codereps
---
⚠️ DEGRADED: single-context (harness policy — no sub-agents spawned unless the user asks)

# Critique — CodeReps web (apps/web)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live timer/keystrokes/faults/par-bar are excellent; Submit jumps to debrief with no "scoring…" acknowledgment |
| 2 | Match System / Real World | 4 | Timing-instrument vocabulary (reps, par, faults, PR, splits) is coherent and domain-fit |
| 3 | User Control and Freedom | 3 | Back / collapse / skip / reset-filter present; no undo, no explicit "abandon rep" |
| 4 | Consistency and Standards | 4 | One button family, one mono-label system, consistent chip/pill/segmented across all screens |
| 5 | Error Prevention | 3 | Paste blocked, no-autocomplete enforced; "Skip today"/"Rebuild" unconfirmed (low-risk) |
| 6 | Recognition Rather Than Recall | 4 | Text-labeled nav, visible ⌘↵/⌘R hints, active-tab location, prompt always visible in-rep |
| 7 | Flexibility and Efficiency | 3 | Keyboard-first with shortcuts; no command palette / bulk actions |
| 8 | Aesthetic and Minimalist Design | 4 | Restrained; chrome recedes on focus; every element earns its pixel |
| 9 | Error Recovery | 3 | Input error is plain + specific; NotFound teaches the way back; few error surfaces yet |
| 10 | Help and Documentation | 3 | Prompt panel teaches each rep, constraints footer, /design-system reference; no onboarding/tooltips |
| **Total** | | **34/40** | **Good (upper band)** |

## Anti-Patterns Verdict

**Would someone say "AI made this"? No.** The identity is specific — athletic timing instrument — and avoids every dark-dev-tool reflex: no terminal-green cosplay, no purple AI gradients, no glassmorphism, no gradient text, no hero-metric stat row, no identical icon-card grids, no eyebrow-on-every-section. Cobalt-only signal + amber scarcity + all-mono numerals read as intentional, not templated.

**Deterministic scan:** `detect.mjs` initially flagged 12 advisory `design-system-color` items (10 distinct undocumented oklch micro-shades: avatar chip ×3, rep-dot on/off, mid-cobalt, three ink extremes). **Fixed** — promoted to named `@theme` tokens + documented in DESIGN.md; re-run scan is **0 findings**. The impeccable design hook also ran on every file at write time (all clean).

## What's Working

- **The editor is genuinely the hero.** Real CodeMirror 6 with a custom token-matched theme, live keystroke counting, paste→fault, and the recede-on-focus behavior (chrome to 50%, timer stays legible). The single most important screen carries the product.
- **Numbers behave like hardware.** Every numeral is JetBrains Mono tabular — the timer ticks, the par-bar fills, splits land one-by-one, the PR stamp settles. Motion is state-only, and reveals stay visible if animation never runs (headless-safe).
- **One coherent system across eight surfaces.** The same button/chip/segmented/verdict vocabulary reads identically on Landing, Warmup, Practice, Debrief, Log, Library, and the design-system page.

## Priority Issues

- **[P1] Rep work isn't persisted.** Refresh or navigate-away mid-rep loses the typed code and resets the clock to its seed. For a timed, from-memory tool this is the highest-impact real-product gap. (Scoped: persistence is Sprint 2/3 — flagging now.) *Fix:* persist a draft + server-owned start time. → `/impeccable harden`
- **[P2] Submit has no interim state.** "Submit rep" navigates straight to the debrief; a timed submission should acknowledge ("scoring…") before the verdict lands. *Fix:* brief submitting/scoring affordance. → `/impeccable harden`
- **[P2] No first-run / zero-data state.** Heatmap, readiness, and library all assume an established user; a brand-new user should meet an activation path ("your heatmap starts today"), not populated data. *Fix:* zero-state + first-rep onboarding. → `/impeccable onboard`
- **[P3] Debrief diff panes are fixed-tall and hollow** under short solutions. *Fix:* size panes to content or add an end-of-file affordance. → `/impeccable layout`
- **[P3] Sub-1024 practice layout is undefined** (desktop-first by design; 1440 + 1024 are exact). *Fix:* define a narrow/stacked fallback. → `/impeccable adapt`

## Persona Red Flags

- **Alex (power user):** Strong — ⌘↵ submit / ⌘R run, keyboard-first, no forced onboarding. *Flag:* Run feedback is a subtle status-bar string with no result summary near the action; no quick re-run affordance.
- **Sam (accessibility):** Strong — pass/fail is icon+word (never color-alone), visible 2px cobalt focus rings, keyboard-operable, AA contrast, decorative dots/sparklines aria-hidden. *Flag:* the elapsed timer's `aria-label` changes every second — if focused, a screen reader could chatter; give it a calmer summary.
- **Riley (stress tester):** Library empty-filter state teaches (good). *Flags:* refresh mid-rep loses work (see P1); very long challenge titles could crowd the fixed-width Library/table columns.

## Minor Observations

- "Run tests" is inert (Sprint 2 runner); it currently fakes a pass count. Fine for the design build; wire to the JS worker later.
- Landing header/footer borders are contained to the max-width container — intentional, reads clean.
- Timer/keystroke seeds only apply to the flagship `debounce` rep; other slugs start at 0:00 — expected.

## Questions to Consider

- What should a *cold* CodeReps look like — the very first session, zero reps, empty heatmap? That's the missing screen.
- Should submitting a rep feel like *stopping a stopwatch* (a beat of finality) before the debrief, rather than an instant cut?
- Is there a lightweight "resume where I left off" that survives a refresh, so a real 15-minute rep can't be lost to a stray Cmd-R?
