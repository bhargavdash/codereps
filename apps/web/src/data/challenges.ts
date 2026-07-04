import type { Challenge } from "./types";

/**
 * Challenge catalog (static content). Progress lives separately in app-data.
 * `debounce` carries full debrief detail; the rest are concise but real, so
 * every Library row opens a genuine rep.
 */

const debounce: Challenge = {
  slug: "debounce",
  title: "Debounce",
  category: "javascript",
  topic: "Timing",
  difficulty: 3,
  language: "javascript",
  fileName: "debounce.js",
  parSeconds: 240,
  prompt:
    "Write a debounce utility from memory. It wraps a function and delays running it until the calls have been quiet for a set interval.",
  requirements: [
    "Take `fn` and `wait` (ms); return a new debounced function.",
    "Each call resets the timer; fn runs once, `wait` ms after the last call.",
    "Preserve `this` and all arguments when fn finally runs.",
    "Support a `leading` option: fire on the first call, then stay quiet.",
  ],
  behavesLike:
    "Called 5× within 100ms with `wait = 200` → fn runs once, 200ms after the last call.",
  starterCode: `// debounce.js — implement from memory
function debounce(fn, wait, { leading = false } = {}) {
  let timer = null;
  let ranLeading = false;

  return function (...args) {
    const ctx = this;
    const callNow = leading && !timer;

    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!leading) fn.apply(ctx, args);
      ranLeading = false;
    }, wait);

    if (callNow) {
      fn.apply(ctx, args);
      ranLeading = true;
    }
  };
}`,
  solutionCode: `function debounce(fn, wait, { leading = false } = {}) {
  let timer = null;
  return function (...args) {
    const callNow = leading && timer === null;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!leading) fn.apply(this, args);
    }, wait);
    if (callNow) fn.apply(this, args);
  };
}`,
  yourCode: `function debounce(fn, wait, { leading = false } = {}) {
  let timer = null;
  let ranLeading = false;
  return function (...args) {
    const ctx = this;
    const callNow = leading && !timer;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!leading) fn.apply(ctx, args);
    }, wait);
    if (callNow) fn.apply(ctx, args);
  };
}`,
  tests: [
    { name: "delays until calls go quiet", ms: 2, passed: true },
    { name: "cancels the previous timer", ms: 1, passed: true },
    { name: "passes the latest arguments", ms: 3, passed: true },
    { name: "preserves `this` binding", ms: 1, passed: true },
    { name: "leading edge fires once", ms: 4, passed: true },
  ],
};

/** Build a concise-but-real challenge from a small spec. */
function make(spec: {
  slug: string;
  title: string;
  category: Challenge["category"];
  topic: string;
  difficulty: number;
  language: Challenge["language"];
  fileName: string;
  parSeconds: number;
  prompt: string;
  requirements: string[];
  behavesLike: string;
  starterCode: string;
  solutionCode: string;
  tests: { name: string; ms: number }[];
}): Challenge {
  return {
    ...spec,
    yourCode: spec.solutionCode,
    tests: spec.tests.map((t) => ({ ...t, passed: true })),
  };
}

const rest: Challenge[] = [
  make({
    slug: "discriminated-unions",
    title: "Discriminated unions",
    category: "typescript",
    topic: "Types",
    difficulty: 4,
    language: "typescript",
    fileName: "shape.ts",
    parSeconds: 300,
    prompt:
      "Model a `Shape` as a discriminated union and write an `area` function that the compiler proves is exhaustive.",
    requirements: [
      "Union of `circle`, `square`, `rect`, each with a `kind` tag.",
      "`area(shape)` narrows on `kind` with no casts.",
      "A `never` default so a new variant is a compile error.",
    ],
    behavesLike: "Add a `triangle` variant → `area` fails to compile until you handle it.",
    starterCode: `// shape.ts — from memory
type Shape =
  | { kind: "circle"; r: number }

function area(shape: Shape): number {
  switch (shape.kind) {
  }
}`,
    solutionCode: `type Shape =
  | { kind: "circle"; r: number }
  | { kind: "square"; size: number }
  | { kind: "rect"; w: number; h: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.r ** 2;
    case "square": return shape.size ** 2;
    case "rect": return shape.w * shape.h;
    default: {
      const _exhaustive: never = shape;
      return _exhaustive;
    }
  }
}`,
    tests: [
      { name: "circle area", ms: 1 },
      { name: "square area", ms: 1 },
      { name: "rect area", ms: 1 },
      { name: "exhaustiveness is enforced", ms: 2 },
    ],
  }),
  make({
    slug: "usereducer-from-scratch",
    title: "useReducer from scratch",
    category: "react",
    topic: "Hooks",
    difficulty: 3,
    language: "tsx",
    fileName: "useReducer.ts",
    parSeconds: 360,
    prompt:
      "Reimplement `useReducer` on top of `useState` — dispatch runs the reducer and re-renders with the next state.",
    requirements: [
      "Signature `useReducer(reducer, initial)` returns `[state, dispatch]`.",
      "`dispatch(action)` computes `reducer(state, action)` and stores it.",
      "`dispatch` identity is stable across renders.",
    ],
    behavesLike: "A counter with `{type:'inc'}` increments once per dispatch, no stale reads.",
    starterCode: `// useReducer.ts — from memory
import { useState, useCallback } from "react";

function useReducer(reducer, initial) {

}`,
    solutionCode: `import { useState, useCallback } from "react";

function useReducer(reducer, initial) {
  const [state, setState] = useState(initial);
  const dispatch = useCallback(
    (action) => setState((s) => reducer(s, action)),
    [reducer],
  );
  return [state, dispatch];
}`,
    tests: [
      { name: "returns initial state", ms: 1 },
      { name: "dispatch advances state", ms: 2 },
      { name: "batched dispatches compose", ms: 2 },
      { name: "dispatch is stable", ms: 1 },
    ],
  }),
  make({
    slug: "deep-clone",
    title: "Deep clone",
    category: "javascript",
    topic: "Objects",
    difficulty: 3,
    language: "javascript",
    fileName: "deepClone.js",
    parSeconds: 300,
    prompt: "Deep-clone a value: nested objects and arrays, handling cycles.",
    requirements: [
      "Clone plain objects and arrays recursively.",
      "Return primitives as-is.",
      "Handle circular references with a seen-map.",
    ],
    behavesLike: "A self-referencing object clones without a stack overflow.",
    starterCode: `// deepClone.js — from memory
function deepClone(value, seen = new WeakMap()) {

}`,
    solutionCode: `function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value);
  const out = Array.isArray(value) ? [] : {};
  seen.set(value, out);
  for (const k of Object.keys(value)) out[k] = deepClone(value[k], seen);
  return out;
}`,
    tests: [
      { name: "clones nested objects", ms: 2 },
      { name: "clones arrays", ms: 1 },
      { name: "primitives pass through", ms: 1 },
      { name: "survives cycles", ms: 3 },
    ],
  }),
  make({
    slug: "lru-cache",
    title: "LRU cache",
    category: "dsa",
    topic: "Data structures",
    difficulty: 4,
    language: "javascript",
    fileName: "LRUCache.js",
    parSeconds: 420,
    prompt: "Build a fixed-capacity LRU cache with O(1) get and put.",
    requirements: [
      "`get(key)` returns the value and marks it most-recently used.",
      "`put(key, value)` evicts the least-recently used at capacity.",
      "Both operations are O(1).",
    ],
    behavesLike: "Capacity 2: put a, put b, get a, put c → b is evicted.",
    starterCode: `// LRUCache.js — from memory
class LRUCache {
  constructor(capacity) {

  }
}`,
    solutionCode: `class LRUCache {
  constructor(capacity) {
    this.cap = capacity;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    const v = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.cap) this.map.delete(this.map.keys().next().value);
    this.map.set(key, value);
  }
}`,
    tests: [
      { name: "get returns stored value", ms: 1 },
      { name: "put updates existing key", ms: 1 },
      { name: "evicts least-recently used", ms: 2 },
      { name: "get refreshes recency", ms: 2 },
    ],
  }),
  make({
    slug: "flatten-nested-array",
    title: "Flatten nested array",
    category: "javascript",
    topic: "Arrays",
    difficulty: 2,
    language: "javascript",
    fileName: "flatten.js",
    parSeconds: 180,
    prompt: "Flatten an arbitrarily nested array to a given depth.",
    requirements: [
      "`flatten(arr, depth = Infinity)` returns a new array.",
      "Respect the depth limit; don't mutate the input.",
    ],
    behavesLike: "`flatten([1,[2,[3]]], 1)` → `[1, 2, [3]]`.",
    starterCode: `// flatten.js — from memory
function flatten(arr, depth = Infinity) {

}`,
    solutionCode: `function flatten(arr, depth = Infinity) {
  return arr.reduce((acc, item) => {
    if (Array.isArray(item) && depth > 0) acc.push(...flatten(item, depth - 1));
    else acc.push(item);
    return acc;
  }, []);
}`,
    tests: [
      { name: "flattens one level", ms: 1 },
      { name: "respects depth", ms: 1 },
      { name: "infinite depth", ms: 2 },
      { name: "does not mutate input", ms: 1 },
    ],
  }),
  make({
    slug: "custom-useeffect",
    title: "Custom useEffect",
    category: "react",
    topic: "Hooks",
    difficulty: 5,
    language: "tsx",
    fileName: "useEffect.ts",
    parSeconds: 480,
    prompt: "Reimplement `useEffect`: run after render, re-run on dep change, clean up.",
    requirements: [
      "Compare deps to the previous render's deps.",
      "Run the cleanup before the next effect and on unmount.",
      "No deps array → run every render.",
    ],
    behavesLike: "Changing one dep re-runs the effect exactly once and cleans up the prior run.",
    starterCode: `// useEffect.ts — from memory
function useEffect(effect, deps) {

}`,
    solutionCode: `function useEffect(effect, deps) {
  const ref = useRef({ deps: undefined, cleanup: undefined });
  const changed =
    !deps || !ref.current.deps || deps.some((d, i) => !Object.is(d, ref.current.deps[i]));
  if (changed) {
    ref.current.cleanup?.();
    ref.current.cleanup = effect() || undefined;
    ref.current.deps = deps;
  }
}`,
    tests: [
      { name: "runs after first render", ms: 2 },
      { name: "re-runs on dep change", ms: 3 },
      { name: "skips when deps equal", ms: 1 },
      { name: "cleans up on unmount", ms: 2 },
    ],
  }),
  make({
    slug: "flexbox-holy-grail",
    title: "Flexbox holy grail",
    category: "css",
    topic: "Layout",
    difficulty: 2,
    language: "css",
    fileName: "layout.css",
    parSeconds: 240,
    prompt: "Header, footer, and a three-column body that fills the viewport — flexbox only.",
    requirements: [
      "Header and footer are fixed height; body fills the rest.",
      "Center column is fluid; side columns are fixed width.",
      "No overflow, no fixed positioning.",
    ],
    behavesLike: "At any viewport height the footer sits at the bottom with no gap.",
    starterCode: `/* layout.css — from memory */
.page {

}`,
    solutionCode: `.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.body {
  flex: 1;
  display: flex;
  min-height: 0;
}
.body > main { flex: 1; }
.body > aside { flex: 0 0 240px; }`,
    tests: [
      { name: "footer pinned to bottom", ms: 1 },
      { name: "center column fluid", ms: 1 },
      { name: "sides fixed width", ms: 1 },
    ],
  }),
  make({
    slug: "promise-all-polyfill",
    title: "Promise.all polyfill",
    category: "javascript",
    topic: "Async",
    difficulty: 3,
    language: "javascript",
    fileName: "promiseAll.js",
    parSeconds: 300,
    prompt: "Reimplement `Promise.all` — resolve with an ordered array, reject on first failure.",
    requirements: [
      "Resolve when every input settles, preserving index order.",
      "Reject immediately if any input rejects.",
      "Accept non-promise values too.",
    ],
    behavesLike: "One rejection short-circuits; results keep input order regardless of timing.",
    starterCode: `// promiseAll.js — from memory
function promiseAll(items) {

}`,
    solutionCode: `function promiseAll(items) {
  return new Promise((resolve, reject) => {
    const out = [];
    let done = 0;
    if (items.length === 0) return resolve(out);
    items.forEach((item, i) => {
      Promise.resolve(item).then((v) => {
        out[i] = v;
        if (++done === items.length) resolve(out);
      }, reject);
    });
  });
}`,
    tests: [
      { name: "resolves in order", ms: 3 },
      { name: "rejects on first error", ms: 2 },
      { name: "handles plain values", ms: 1 },
      { name: "empty input resolves", ms: 1 },
    ],
  }),
  make({
    slug: "generic-type-guard",
    title: "Generic type guard",
    category: "typescript",
    topic: "Types",
    difficulty: 3,
    language: "typescript",
    fileName: "isRecord.ts",
    parSeconds: 240,
    prompt: "Write a reusable type guard that narrows `unknown` to a keyed record.",
    requirements: [
      "`isRecord(x)` narrows to `Record<string, unknown>`.",
      "Reject `null`, arrays, and primitives.",
    ],
    behavesLike: "After the guard, indexing keys type-checks with no cast.",
    starterCode: `// isRecord.ts — from memory
function isRecord(x: unknown): x is Record<string, unknown> {

}`,
    solutionCode: `function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}`,
    tests: [
      { name: "accepts plain object", ms: 1 },
      { name: "rejects null", ms: 1 },
      { name: "rejects array", ms: 1 },
    ],
  }),
  make({
    slug: "binary-search",
    title: "Binary search",
    category: "dsa",
    topic: "Search",
    difficulty: 2,
    language: "javascript",
    fileName: "binarySearch.js",
    parSeconds: 180,
    prompt: "Return the index of a target in a sorted array, or -1 — no off-by-ones.",
    requirements: [
      "Half-open bounds; loop while `lo < hi`.",
      "Return -1 when absent.",
    ],
    behavesLike: "Works on empty arrays and both endpoints without an infinite loop.",
    starterCode: `// binarySearch.js — from memory
function binarySearch(arr, target) {

}`,
    solutionCode: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return -1;
}`,
    tests: [
      { name: "finds an element", ms: 1 },
      { name: "returns -1 when absent", ms: 1 },
      { name: "handles endpoints", ms: 1 },
      { name: "handles empty array", ms: 1 },
    ],
  }),
  make({
    slug: "throttle",
    title: "Throttle",
    category: "javascript",
    topic: "Timing",
    difficulty: 2,
    language: "javascript",
    fileName: "throttle.js",
    parSeconds: 210,
    prompt: "Throttle a function to at most once per interval, with a trailing call.",
    requirements: [
      "Fire immediately, then ignore calls for `wait` ms.",
      "Run once more with the latest args if calls happened during the wait.",
    ],
    behavesLike: "Ten calls in 100ms with `wait = 50` → runs at 0ms and ~50ms.",
    starterCode: `// throttle.js — from memory
function throttle(fn, wait) {

}`,
    solutionCode: `function throttle(fn, wait) {
  let last = 0, timer = null, lastArgs = null;
  return function (...args) {
    const now = Date.now();
    const remaining = wait - (now - last);
    lastArgs = args;
    if (remaining <= 0) {
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(this, lastArgs);
      }, remaining);
    }
  };
}`,
    tests: [
      { name: "fires on leading edge", ms: 2 },
      { name: "ignores during window", ms: 1 },
      { name: "trailing call with latest args", ms: 3 },
    ],
  }),
  make({
    slug: "memoize",
    title: "Memoize",
    category: "javascript",
    topic: "Functions",
    difficulty: 2,
    language: "javascript",
    fileName: "memoize.js",
    parSeconds: 210,
    prompt: "Cache a pure function's results keyed by its arguments.",
    requirements: [
      "Return cached results for repeat argument sets.",
      "Support a custom key resolver; default to JSON of args.",
    ],
    behavesLike: "An expensive fib runs each n once; repeats are instant.",
    starterCode: `// memoize.js — from memory
function memoize(fn, resolver) {

}`,
    solutionCode: `function memoize(fn, resolver) {
  const cache = new Map();
  return function (...args) {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}`,
    tests: [
      { name: "caches by arguments", ms: 1 },
      { name: "custom resolver", ms: 1 },
      { name: "distinct args miss", ms: 1 },
    ],
  }),
];

export const CHALLENGES: Challenge[] = [debounce, ...rest];

const bySlug = new Map(CHALLENGES.map((c) => [c.slug, c]));

export function getChallenge(slug: string | undefined): Challenge | undefined {
  return slug ? bySlug.get(slug) : undefined;
}
