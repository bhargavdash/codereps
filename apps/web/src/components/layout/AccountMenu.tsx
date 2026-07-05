import { useEffect, useRef, useState } from "react";
import { Avatar } from "../ui/Avatar";
import { useAuth } from "../../lib/auth-context";

function initialsFromEmail(email: string | undefined): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? "?";
  return local.slice(0, 2).toUpperCase();
}

/** Replaces the bare Avatar with a working sign-out affordance — Esc + outside-click close. */
export function AccountMenu() {
  const { session, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!session) return null;
  const email = session.user.email;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <Avatar initials={initialsFromEmail(profile?.username ?? email)} size={27} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-md border border-border-2 bg-surface p-1.5 shadow-[0_8px_24px_-8px_oklch(0_0_0/0.5)]"
          style={{ zIndex: "var(--z-dropdown)" as unknown as number }}
        >
          <div className="truncate px-2.5 py-2 text-[12.5px] text-muted-2">{email}</div>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void signOut()}
            className="w-full rounded px-2.5 py-2 text-left text-[13px] text-ink hover:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
