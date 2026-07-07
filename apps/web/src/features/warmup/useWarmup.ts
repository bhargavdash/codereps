import { useCallback, useEffect, useState } from "react";
import type { WarmupResponse } from "@codereps/shared";
import { api, ApiError } from "../../lib/api";

export type WarmupState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; warmup: WarmupResponse };

export function useWarmup(): { state: WarmupState; retry: () => void } {
  const [state, setState] = useState<WarmupState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    api<WarmupResponse>("/api/v1/warmup")
      .then((warmup) => {
        if (!cancelled) setState({ status: "ready", warmup });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message:
            err instanceof ApiError ? err.message : "Couldn't load today's warmup. Is the API running?",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return { state, retry: useCallback(() => setAttempt((n) => n + 1), []) };
}
