export interface Env {
  port: number;
  webOrigin: string;
  /** Feature-gated: auth endpoints return 503 until this is configured. */
  supabaseUrl: string | undefined;
}

let cached: Env | undefined;

export function env(): Env {
  cached ??= {
    port: Number(process.env.PORT) || 4000,
    webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
    supabaseUrl: process.env.SUPABASE_URL?.replace(/\/$/, ""),
  };
  return cached;
}
