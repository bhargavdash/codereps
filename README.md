# CodeReps

> AI writes your code. Can you still write it yourself?

A coding fluency gym: timed practice reps in an editor with **no autocomplete, no AI, no paste** — evaluated instantly in your own browser, scored against par times, tracked with streaks and a fluency score that decays when you stop practicing.

LeetCode tests whether you can *solve* problems. CodeReps tests whether you can still *execute* solutions you already understand — the specific muscle that atrophies when AI writes your code daily.

## Stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Web | Vite · React 19 · TypeScript · Tailwind v4 · CodeMirror 6 |
| API | Express v5 · TypeScript (Railway) |
| Data | Prisma → Supabase Postgres · Supabase Auth |
| Code execution | **In the browser** — Web Workers (JS/DSA), sandboxed iframes (React/CSS), TypeScript-in-worker (type challenges). No server-side execution at all. |

## Workspace layout

```
apps/
  web/        Vite React SPA (Vercel)
  api/        Express API (Railway)
packages/
  shared/     domain types + Zod schemas shared across the boundary
  db/         Prisma schema + client
docs/design/  design system exports (Claude Design)
```

## Getting started

```bash
pnpm install
cp .env.example apps/api/.env      # fill in Supabase values
cp .env.example apps/web/.env
cp .env.example packages/db/.env
pnpm build                          # builds shared → db (prisma generate) → apps
pnpm dev                            # web on :5173, api on :4000
```

## Status

Sprint 0 — bootstrap complete (S0-1). Sprint board and full architecture live in the DevBrain vault (`wiki/projects/codereps-board.md`, `wiki/projects/codereps-architecture.md`).
