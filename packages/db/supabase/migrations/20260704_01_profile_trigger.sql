-- =============================================================================
-- Migration: Auto-create Profile row when a Supabase user signs up
--
-- Replicated from nomad-api's profile trigger pattern exactly, adapted for one
-- real schema difference: profiles.username is NOT NULL UNIQUE here (Nomad's
-- isn't). A naive `split_part(email, '@', 1)` can collide across users and
-- would abort the auth.users insert itself (the trigger runs in the same
-- transaction as signup). Suffixing with part of the user's own id — which is
-- already unique — makes the generated username collision-proof by
-- construction, with no retry logic needed.
--
-- The Express API's POST /api/v1/auth/sync (apps/api/src/routes/auth.ts) is
-- the idempotent confirm, not the creator — same division of labour as Nomad.
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- (Run BEFORE 20260704_02_rls_policies.sql)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    lower(regexp_replace(coalesce(split_part(NEW.email, '@', 1), 'user'), '[^a-z0-9_]', '', 'gi'))
      || '_' || substr(replace(NEW.id::text, '-', ''), 1, 6)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop first so re-running this file is safe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
