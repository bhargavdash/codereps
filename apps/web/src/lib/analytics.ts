/**
 * Launch instrumentation (S6-5). Transport-agnostic: events log to the
 * console in dev and flow to PostHog only when VITE_POSTHOG_KEY is set —
 * zero bytes of vendor code ship otherwise (lazy import).
 */

type EventName =
  | "rep_started"
  | "rep_submitted"
  | "rep_abandoned"
  | "warmup_completed"
  | "signed_up"
  | "signed_in";

interface PostHogLike {
  init(key: string, options: Record<string, unknown>): void;
  capture(event: string, props?: Record<string, unknown>): void;
}

let posthog: PostHogLike | null = null;
let bootPromise: Promise<void> | null = null;

function boot(): Promise<void> {
  bootPromise ??= (async () => {
    const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
    if (!key) return;
    try {
      const mod = (await import("posthog-js")) as unknown as { default: PostHogLike };
      mod.default.init(key, {
        api_host: (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com",
        autocapture: false, // events are explicit; keystrokes must never leak
        capture_pageview: true,
      });
      posthog = mod.default;
    } catch {
      /* analytics must never break the product */
    }
  })();
  return bootPromise;
}

export function track(event: EventName, props: Record<string, string | number | boolean> = {}): void {
  if (import.meta.env.DEV) {
    console.debug("[analytics]", event, props);
  }
  void boot().then(() => posthog?.capture(event, props));
}
