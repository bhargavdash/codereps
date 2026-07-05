/**
 * Structural equality for test assertions. Covers what challenge data
 * actually contains: primitives (NaN-safe), arrays, plain objects, Date,
 * RegExp, Map, Set. Anything exotic falls back to reference equality.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }

  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (a instanceof RegExp || b instanceof RegExp) {
    return a instanceof RegExp && b instanceof RegExp && a.toString() === b.toString();
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set) || !(b instanceof Set) || a.size !== b.size) return false;
    // O(n²) member match — assertion data is small.
    outer: for (const itemA of a) {
      for (const itemB of b) if (deepEqual(itemA, itemB)) continue outer;
      return false;
    }
    return true;
  }

  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map) || !(b instanceof Map) || a.size !== b.size) return false;
    for (const [key, valA] of a) {
      if (!b.has(key) || !deepEqual(valA, b.get(key))) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/** Compact single-line stringify for failure messages. */
export function stringify(value: unknown): string {
  if (typeof value === "function") return `[function ${value.name || "anonymous"}]`;
  if (value === undefined) return "undefined";
  if (typeof value === "bigint") return `${value}n`;
  if (value instanceof Map) return `Map(${stringify([...value.entries()])})`;
  if (value instanceof Set) return `Set(${stringify([...value.values()])})`;
  try {
    const json = JSON.stringify(value, (_k, v: unknown) =>
      typeof v === "number" && !Number.isFinite(v) ? String(v) : v,
    );
    return json.length > 200 ? `${json.slice(0, 200)}…` : json;
  } catch {
    return String(value);
  }
}
