import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FaultKind } from "./RepEditor";

export interface RepSession {
  elapsed: number;
  keystrokes: number;
  faults: number;
  /** Last fault, for the transient "resisted" toast. Cleared automatically. */
  lastFault: { kind: FaultKind; seq: number } | null;
  editing: boolean;
  over: boolean;
  barPct: number;
  addKeystrokes: (delta: number) => void;
  recordFault: (kind: FaultKind) => void;
  setEditing: (editing: boolean) => void;
}

/**
 * The rep clock and its honest counters — board S2-2.
 * Keystrokes arrive from RepEditor's updateListener (user-event transactions
 * only — not raw keydowns, so shortcuts/IME noise don't inflate the count).
 * The local timer is display-only; the server owns real durations (S3-1).
 */
export function useRepSession(parSeconds: number): RepSession {
  const [elapsed, setElapsed] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const [faults, setFaults] = useState(0);
  const [lastFault, setLastFault] = useState<RepSession["lastFault"]>(null);
  const [editing, setEditing] = useState(false);
  const faultSeq = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // the toast clears itself; a new fault re-triggers via seq
  useEffect(() => {
    if (!lastFault) return;
    const id = window.setTimeout(() => setLastFault(null), 1800);
    return () => window.clearTimeout(id);
  }, [lastFault]);

  const addKeystrokes = useCallback((delta: number) => {
    setKeystrokes((k) => k + delta);
  }, []);

  const recordFault = useCallback((kind: FaultKind) => {
    faultSeq.current += 1;
    setFaults((f) => f + 1);
    setLastFault({ kind, seq: faultSeq.current });
  }, []);

  const over = elapsed > parSeconds;
  const barPct = Math.min(100, (elapsed / parSeconds) * 100);

  return useMemo(
    () => ({
      elapsed,
      keystrokes,
      faults,
      lastFault,
      editing,
      over,
      barPct,
      addKeystrokes,
      recordFault,
      setEditing,
    }),
    [elapsed, keystrokes, faults, lastFault, editing, over, barPct, addKeystrokes, recordFault],
  );
}
