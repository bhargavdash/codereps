import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { api, ApiError } from "./api";

interface Profile {
  id: string;
  username: string;
  displayName: string | null;
}

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  /** true only while the very first session check is in flight */
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setProfile(null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  // Ensure the Profile row exists (idempotent) whenever a session appears.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    api<{ profile: Profile }>("/api/v1/auth/sync", { method: "POST" })
      .then(({ profile: p }) => {
        if (!cancelled) setProfile(p);
      })
      .catch((err) => {
        // API not configured/reachable yet (e.g. Railway not deployed) — auth still works.
        if (!(err instanceof ApiError)) console.error("auth/sync failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const value: AuthContextValue = {
    session,
    profile,
    loading,
    async signInWithPassword(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signUpWithPassword(email, password) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    },
    async signOut() {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
