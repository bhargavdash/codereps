-- =============================================================================
-- Migration: Row Level Security (RLS) for all tables
--
-- Why RLS? (same rationale as nomad-api, verbatim)
--   Even though our Express backend enforces ownership checks, RLS is a
--   second layer of defence at the database level. If a bug bypasses the
--   backend, Postgres itself refuses the query.
--
--   Note for CodeReps specifically: the Express API connects to Postgres via
--   Prisma over DATABASE_URL (the `postgres` role), not via PostgREST as the
--   `authenticated`/`anon` Supabase roles — so today, nothing in this stack
--   queries Postgres in a way RLS actually gates. These policies are enabled
--   anyway, matching Nomad's defense-in-depth posture, and become load-bearing
--   the moment anything (a future direct-from-browser query, a Supabase Edge
--   Function) talks to Postgres as an authenticated Supabase user.
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- (Run AFTER 20260704_01_profile_trigger.sql)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- The trigger function (SECURITY DEFINER) handles INSERT — no INSERT policy
-- needed from user sessions.

-- ---------------------------------------------------------------------------
-- challenges — public read of published content only, no user writes
-- ---------------------------------------------------------------------------
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenges: public read published"
  ON public.challenges FOR SELECT
  USING (is_published = true);

-- ---------------------------------------------------------------------------
-- attempts
-- ---------------------------------------------------------------------------
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attempts: select own"
  ON public.attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "attempts: insert own"
  ON public.attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- submissions — append-only once written; no update/delete policy needed
-- ---------------------------------------------------------------------------
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions: select own"
  ON public.submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "submissions: insert own"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- user_challenge_progress
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_challenge_progress: select own"
  ON public.user_challenge_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_challenge_progress: insert own"
  ON public.user_challenge_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_challenge_progress: update own"
  ON public.user_challenge_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- daily_activity
-- ---------------------------------------------------------------------------
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_activity: select own"
  ON public.daily_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_activity: insert own"
  ON public.daily_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_activity: update own"
  ON public.daily_activity FOR UPDATE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- streaks
-- ---------------------------------------------------------------------------
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streaks: select own"
  ON public.streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "streaks: insert own"
  ON public.streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks: update own"
  ON public.streaks FOR UPDATE
  USING (auth.uid() = user_id);
