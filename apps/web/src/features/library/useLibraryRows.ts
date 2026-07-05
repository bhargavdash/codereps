import { useCallback, useEffect, useState } from "react";
import type { ChallengeListResponse } from "@codereps/shared";
import { api, ApiError } from "../../lib/api";
import type { LibraryRow } from "../../data/types";

export type LibraryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; rows: LibraryRow[] };

/**
 * Real challenge catalog from GET /api/v1/challenges. Progress fields
 * (best / daysAgo / reps) stay empty until UserChallengeProgress is wired in
 * Sprint 5 — the columns render their honest untrained state meanwhile.
 */
export function useLibraryRows(): { state: LibraryState; retry: () => void } {
  const [state, setState] = useState<LibraryState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    api<ChallengeListResponse>("/api/v1/challenges?limit=100")
      .then(({ challenges }) => {
        if (cancelled) return;
        setState({
          status: "ready",
          rows: challenges.map((c) => ({
            slug: c.slug,
            title: c.title,
            category: c.category,
            difficulty: c.difficulty,
            best: null,
            daysAgo: null,
            reps: 0,
          })),
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            err instanceof ApiError
              ? err.message
              : "Couldn't reach the CodeReps API. Is it running?",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
