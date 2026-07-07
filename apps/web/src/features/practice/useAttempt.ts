import { useEffect, useState } from "react";
import type { AttemptResponse } from "@codereps/shared";
import { api, ApiError } from "../../lib/api";

export interface OpenAttempt {
  attemptId: string;
  startedAt: Date;
  timeLimitSeconds: number;
}

/**
 * Server-attested rep start (S3-1): POST /attempts when a runnable challenge
 * opens. A 409 attempt_open (double-click / fast remount) adopts the existing
 * attempt instead of erroring — same rep, same clock.
 */
export function useAttempt(challengeId: string | undefined): {
  attempt: OpenAttempt | null;
  error: string | null;
} {
  const [attempt, setAttempt] = useState<OpenAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAttempt(null);
    setError(null);
    if (!challengeId) return;
    let cancelled = false;

    api<AttemptResponse>("/api/v1/attempts", {
      method: "POST",
      body: JSON.stringify({ challengeId }),
    })
      .then((res) => {
        if (cancelled) return;
        setAttempt({
          attemptId: res.attemptId,
          startedAt: new Date(res.startedAt),
          timeLimitSeconds: res.timeLimitSeconds,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === "attempt_open" && err.details?.attemptId) {
          setAttempt({
            attemptId: String(err.details.attemptId),
            startedAt: new Date(String(err.details.startedAt)),
            timeLimitSeconds: Number(err.details.timeLimitSeconds) || 600,
          });
          return;
        }
        setError(err instanceof ApiError ? err.message : "Couldn't start the rep — is the API running?");
      });

    return () => {
      cancelled = true;
    };
  }, [challengeId]);

  return { attempt, error };
}
