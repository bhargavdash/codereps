import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    /** The full error payload — some errors carry extra fields (e.g. attempt_open → attemptId). */
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

/** Authenticated fetch to the CodeReps API — attaches the live Supabase access token. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session && { Authorization: `Bearer ${session.access_token}` }),
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error?.code ?? "unknown",
      body?.error?.message ?? `Request failed: ${res.status}`,
      body?.error,
    );
  }
  return body as T;
}
