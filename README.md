# CodeReps

> AI writes your code. Can you still write it yourself?

A coding fluency gym: timed practice reps in an editor with **no autocomplete, no AI, no paste** — evaluated instantly in your own browser, scored against par times, tracked with streaks and a fluency score that decays when you stop practicing.

LeetCode tests whether you can *solve* problems. CodeReps tests whether you can still *execute* solutions you already understand — the specific muscle that atrophies when AI writes your code daily.

## Stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Web | Vite · React 19 · TypeScript · Tailwind v4 · CodeMirror 6 |
| API | Express v5 · TypeScript |
| Data | Prisma → Supabase Postgres · Supabase Auth (JWKS-verified, no service key) |
| Code execution | **In the browser** — Web Workers (JS/DSA), sandboxed iframes (React/CSS), TypeScript-in-worker (type challenges). No server-side execution at all. |

## Architecture

### The core trade: delete the execution server

Every challenge category is JavaScript-ecosystem, so the user's browser *is* the runtime. That decision removes the hardest infra problem (sandboxed remote code execution) entirely:

- **JS / DSA** → a fresh Web Worker per run. The harness binds `postMessage` before user code evaluates (clobber-proof), `structuredClone`s inputs, runs cases sequentially under per-case deadlines, and the main thread hard-kills the worker at 4s — `while(true)` can't freeze the tab.
- **React** → a `sandbox="allow-scripts"` iframe (opaque origin: no cookies, no storage, no top-navigation) loading a self-hosted React 19 + Testing Library bundle. Results return over nonce-checked `postMessage`. One iframe per run, pre-warmed on challenge open. Off-screen cross-origin iframes get no rAF and throttled timers, so all harness scheduling rides on `MessageChannel` tasks.
- **TypeScript** → the real compiler, lazy-loaded in a persistent worker; default libs self-hosted and fetched by `/// <reference lib>` chain. Grading = zero diagnostics, with `Expect<Equal<…>>` assertions per case.
- **CSS** → challenge markup + user CSS in a sandboxed iframe; assertions on `getComputedStyle`, with the parent resizing the iframe per case so media queries respond.

Results are client-attested — acceptable for a personal-integrity tool with no leaderboard. Code is stored on submit, so a growth-tier worker can re-verify asynchronously the day a leaderboard exists.

### Trust boundaries the server does own

- **The clock.** An attempt row is created server-side before the rep starts; duration is `server now − startedAt` at submit. The client never reports time, and a "passed" arriving after the time limit records as a timeout.
- **The solution.** `solutionCode` leaves the server in exactly one response: submit/abandon. A CI test sweeps every pre-submit endpoint for leaks.
- **The transaction.** One `prisma.$transaction` per submission: Submission → per-challenge progress (fluency EMA + SM-2 SRS scheduling) → daily activity → streak, with day boundaries computed in the user's timezone.

### Content as code

Challenges are typed TypeScript files in `content/challenges/`, Zod-validated, seeded by an idempotent script that bumps a version on change. CI runs **every challenge's own solution against its own tests in the real runner logic** (`pnpm verify-content`) — the browser workers and the CI gate share one execution module (`packages/shared/runner-core`), so they cannot disagree. Timing-dependent challenges (debounce, throttle) run under an injected fake clock and are stress-tested 50× for determinism.

### The anti-AI posture

A commitment device, not DRM: CodeMirror 6 with hand-picked extensions (no `basicSetup` — it bundles autocompletion), paste/drop/middle-click blocked *and counted* as faults, a keystroke count from user-event transactions only, and a keystroke-level ghost trace (gzipped CodeMirror ChangeSets) recorded from day one.

### Progress math (§ the honest numbers)

- Per-rep fluency: pass → `60 + 40·min(1, par/duration)`; fail → `40·(cases passed/total)`.
- Per-challenge EMA (α = 0.5), then **display decay**: `ema × max(0.6, 1 − 0.015·(days since last pass − 7))` — skills atrophy in the product exactly as in life.
- Category score = mean of top-10 decayed fluencies, hidden until 5 passes.
- SM-2 lite scheduling (1→3→7→14→×ease) feeds a daily warmup: due reviews first, then a weak-spot at your level, then unseen challenges at a difficulty ramp. The day's picks are persisted, so the sheet never rerolls mid-day.

## Workspace layout

```
apps/
  web/          Vite React SPA — editor, runners, screens
  api/          Express API — attempts, submit transaction, warmup, summary
packages/
  shared/       domain types · Zod schemas · runner-core · scoring · SRS
  db/           Prisma schema + client, SQL migrations (RLS, triggers)
content/
  challenges/   typed challenge files (the moat), CI-verified
scripts/        verify-content (CI gate) · seed
docs/design/    design system exports
```

## Getting started

```bash
pnpm install
cp .env.example apps/api/.env      # fill in Supabase values
cp .env.example apps/web/.env
cp .env.example packages/db/.env
pnpm build                          # builds shared → db (prisma generate) → apps
pnpm dev                            # web on :5173, api on :4000
pnpm seed                           # publish content/ to the database
pnpm verify-content -- --stress 50  # run every solution in its runner
```

## Analytics

Explicit events only (`rep_started`, `rep_submitted`, `warmup_completed`, …) via a transport-agnostic tracker. PostHog loads lazily and only when `VITE_POSTHOG_KEY` is set; autocapture is off by design — keystrokes never leave the machine.

## Status

Sprints 0–5 complete: design system, auth, content pipeline, all four browser runners, the full submission loop, and the progress systems (fluency decay, SRS warmups, streaks, heatmap, readiness dashboard) are live against real data. Sprint 6 (content to 90, launch) in progress. Sprint board and full architecture doc live in the DevBrain vault (`wiki/projects/codereps-board.md`, `wiki/projects/codereps-architecture.md`).
