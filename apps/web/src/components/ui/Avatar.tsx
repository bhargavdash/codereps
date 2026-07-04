export function Avatar({ initials, size = 26 }: { initials: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        background: "var(--color-avatar-bg)",
        border: "1px solid var(--color-avatar-border)",
        color: "var(--color-avatar-ink)",
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
