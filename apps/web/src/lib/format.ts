/** Timing formatters — CodeReps reads every number like a stopwatch. */

/** 187 → "3:07" */
export function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, "0")}`;
}

/** signed delta vs par, e.g. -19 → "−0:19", +72 → "+1:12" */
export function fmtDelta(deltaSeconds: number): string {
  const sign = deltaSeconds < 0 ? "−" : "+";
  const abs = Math.abs(Math.floor(deltaSeconds));
  const m = Math.floor(abs / 60);
  const rem = abs % 60;
  return `${sign}${m}:${String(rem).padStart(2, "0")}`;
}

/** 0 → "00", 3 → "03" — fault counter */
export function fmtFaults(n: number): string {
  return String(Math.max(0, n)).padStart(2, "0");
}

/** relative recency label */
export function fmtRecency(daysAgo: number | null): string {
  if (daysAgo === null) return "never";
  if (daysAgo <= 0) return "today";
  if (daysAgo === 1) return "yesterday";
  return `${daysAgo}d ago`;
}
