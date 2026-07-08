import { useEffect, useState } from "react";
import type { MeSummaryResponse } from "@codereps/shared";
import { api } from "./api";
import { useAuth } from "./auth-context";

/**
 * GET /api/v1/me/summary — streak + per-category readiness (S5-5).
 * Null while loading or signed out; consumers render skeletons/nothing.
 */
export function useSummary(): MeSummaryResponse | null {
  const { session } = useAuth();
  const [summary, setSummary] = useState<MeSummaryResponse | null>(null);

  useEffect(() => {
    if (!session) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    api<MeSummaryResponse>("/api/v1/me/summary")
      .then((res) => {
        if (!cancelled) setSummary(res);
      })
      .catch(() => {
        /* shell data is best-effort; screens have their own error states */
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  return summary;
}

/** "At risk" = today not yet qualified and the evening is running out (§ design brief: after 8pm). */
export function streakAtRisk(summary: MeSummaryResponse): boolean {
  return !summary.streak.qualifiedToday && summary.streak.current > 0 && summary.streak.localHour >= 20;
}
