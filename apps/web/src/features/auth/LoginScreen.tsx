import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../../components/ui/Logo";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Lock, Info } from "../../components/icons";
import { useAuth } from "../../lib/auth-context";
import { track } from "../../lib/analytics";

/** Minimal, shell-styled — the session, not the chrome, is the point. */
export function LoginScreen() {
  const { signInWithPassword, signUpWithPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/warmup";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signin") {
        await signInWithPassword(email, password);
        track("signed_in");
        navigate(from, { replace: true });
      } else {
        await signUpWithPassword(email, password);
        track("signed_up");
        setCheckEmail(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-[380px]">
        <Link
          to="/"
          className="mb-10 flex justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
        >
          <Logo size={24} textSize={18} />
        </Link>

        <div className="rounded-lg border border-border bg-surface p-7">
          {checkEmail ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Info size={18} />
              <p className="text-sm text-ink-soft">
                Check <span className="text-ink">{email}</span> for a confirmation link, then come
                back and sign in.
              </p>
              <Button
                variant="ghost"
                offset="surface"
                onClick={() => {
                  setCheckEmail(false);
                  setMode("signin");
                }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <h1 className="mb-1 text-[19px] font-semibold tracking-[-0.01em]">
                {mode === "signin" ? "Sign in" : "Create your account"}
              </h1>
              <p className="mb-6 text-[13px] text-muted">
                {mode === "signin" ? "Get back to your reps." : "Start training your fluency."}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  offset="surface"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="Password"
                  icon={<Lock size={14} />}
                  offset="surface"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={error ?? undefined}
                />

                <Button type="submit" offset="surface" loading={submitting} className="mt-1.5 w-full">
                  {mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                }}
                className="mt-5 w-full rounded text-center text-[13px] text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                {mode === "signin" ? "New here? Create an account" : "Already training? Sign in"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
