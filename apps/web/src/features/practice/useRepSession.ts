import { useCallback, useEffect, useMemo, useState } from "react";

const IGNORED_KEYS = new Set(["Shift", "Meta", "Control", "Alt", "CapsLock", "Fn"]);

export interface RepSession {
  elapsed: number;
  keystrokes: number;
  faults: number;
  editing: boolean;
  over: boolean;
  barPct: number;
  handlers: {
    keydown: (e: KeyboardEvent) => void;
    paste: (e: ClipboardEvent) => boolean;
    focus: () => void;
    blur: () => void;
  };
}

/**
 * The rep clock and its honest counters. Timer ticks up; every non-modifier
 * keystroke counts; paste is blocked and recorded as a fault; focusing the
 * editor puts the session "on the clock" so chrome can recede.
 */
export function useRepSession(
  parSeconds: number,
  seed: { elapsedSeconds: number; keystrokes: number; faults: number },
): RepSession {
  const [elapsed, setElapsed] = useState(seed.elapsedSeconds);
  const [keystrokes, setKeystrokes] = useState(seed.keystrokes);
  const [faults, setFaults] = useState(seed.faults);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const keydown = useCallback((e: KeyboardEvent) => {
    if (IGNORED_KEYS.has(e.key)) return;
    if (e.metaKey || e.ctrlKey) return; // shortcuts aren't reps
    setKeystrokes((k) => k + 1);
  }, []);

  const paste = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
    setFaults((f) => f + 1);
    return true; // signal handled → block the paste
  }, []);

  const focus = useCallback(() => setEditing(true), []);
  const blur = useCallback(() => setEditing(false), []);

  const over = elapsed > parSeconds;
  const barPct = Math.min(100, (elapsed / parSeconds) * 100);

  const handlers = useMemo(
    () => ({ keydown, paste, focus, blur }),
    [keydown, paste, focus, blur],
  );

  return { elapsed, keystrokes, faults, editing, over, barPct, handlers };
}
