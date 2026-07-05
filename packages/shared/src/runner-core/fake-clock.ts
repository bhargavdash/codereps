/**
 * Deterministic timer implementation for timing-dependent challenges
 * (architecture §6 / will-bite #9: debounce and throttle flake without it).
 *
 * The harness injects these in place of the real setTimeout/clearTimeout/
 * setInterval/clearInterval/Date inside user code; test scripts drive time
 * with `await t.clock.tick(ms)`. tick() awaits a microtask flush after each
 * fired timer so async user implementations settle deterministically.
 */

interface ScheduledTimer {
  time: number;
  fn: (...args: unknown[]) => void;
  args: unknown[];
  intervalMs?: number;
}

export interface FakeClock {
  now(): number;
  /** Advance fake time, firing due timers in order. */
  tick(ms: number): Promise<void>;
  pendingTimers(): number;
  setTimeout(fn: (...args: unknown[]) => void, delay?: number, ...args: unknown[]): number;
  clearTimeout(id: number | undefined): void;
  setInterval(fn: (...args: unknown[]) => void, delay?: number, ...args: unknown[]): number;
  clearInterval(id: number | undefined): void;
  /** Date replacement whose `now()` (and no-arg construction) follow fake time. */
  DateCtor: DateConstructor;
}

export function createFakeClock(startAt = 0): FakeClock {
  let currentTime = startAt;
  let nextId = 1;
  const timers = new Map<number, ScheduledTimer>();

  const schedule = (
    fn: (...args: unknown[]) => void,
    delay: number | undefined,
    args: unknown[],
    intervalMs?: number,
  ): number => {
    if (typeof fn !== "function") throw new TypeError("fake clock: callback must be a function");
    const id = nextId++;
    timers.set(id, { time: currentTime + Math.max(0, delay ?? 0), fn, args, intervalMs });
    return id;
  };

  const tick = async (ms: number): Promise<void> => {
    const target = currentTime + Math.max(0, ms);
    for (;;) {
      let dueId: number | undefined;
      let due: ScheduledTimer | undefined;
      for (const [id, timer] of timers) {
        if (timer.time <= target && (due === undefined || timer.time < due.time)) {
          dueId = id;
          due = timer;
        }
      }
      if (dueId === undefined || due === undefined) break;

      currentTime = Math.max(currentTime, due.time);
      if (due.intervalMs !== undefined) {
        due.time = currentTime + Math.max(1, due.intervalMs);
      } else {
        timers.delete(dueId);
      }
      due.fn(...due.args);
      await Promise.resolve(); // let promise reactions run before the next timer
    }
    currentTime = target;
  };

  const FakeDate = class extends Date {
    constructor(...args: unknown[]) {
      if (args.length === 0) {
        super(currentTime);
      } else {
        super(...(args as ConstructorParameters<typeof Date>));
      }
    }
    static override now(): number {
      return currentTime;
    }
  } as DateConstructor;

  return {
    now: () => currentTime,
    tick,
    pendingTimers: () => timers.size,
    setTimeout: (fn, delay, ...args) => schedule(fn, delay, args),
    clearTimeout: (id) => {
      if (id !== undefined) timers.delete(id);
    },
    setInterval: (fn, delay, ...args) => schedule(fn, delay, args, Math.max(1, delay ?? 0)),
    clearInterval: (id) => {
      if (id !== undefined) timers.delete(id);
    },
    DateCtor: FakeDate,
  };
}
