import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "sliding-window-max",
  title: "Sliding window maximum",
  category: "dsa",
  mode: "pattern_drill",
  difficulty: 4,
  runner: "js_worker",
  language: "javascript",
  promptMd: `The monotonic-deque pattern: report the maximum of every window of size \`k\` as it slides across the array — in linear total time.

- \`maxSlidingWindow(nums, k)\` returns an array with the max of each of the \`n − k + 1\` windows, left to right.
- Recomputing the max per window is O(n·k) — too slow for the big input. Maintain a deque of **indices** whose values stay in decreasing order.
- Assume \`1 ≤ k ≤ nums.length\`.`,
  starterCode: `function maxSlidingWindow(nums, k) {

}
`,
  solutionCode: `function maxSlidingWindow(nums, k) {
  const out = [];
  const deque = []; // indices, values decreasing

  for (let i = 0; i < nums.length; i++) {
    // evict indices that left the window
    if (deque.length > 0 && deque[0] <= i - k) deque.shift();
    // evict smaller values — they can never be a max while nums[i] is around
    while (deque.length > 0 && nums[deque[deque.length - 1]] <= nums[i]) {
      deque.pop();
    }
    deque.push(i);
    if (i >= k - 1) out.push(nums[deque[0]]);
  }
  return out;
}
`,
  solutionNotesMd:
    "Store indices, not values — you need them to detect when the front falls out of the window. The invariant: values along the deque strictly decrease, so the front is always the window max. Every index enters and leaves the deque at most once → O(n).",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "maxSlidingWindow",
    cases: [
      {
        type: "call",
        name: "classic example",
        args: [[1, 3, -1, -3, 5, 3, 6, 7], 3],
        expected: [3, 3, 5, 5, 6, 7],
      },
      { type: "call", name: "window of one is the array itself", args: [[4, 2, 12], 1], expected: [4, 2, 12] },
      { type: "call", name: "window spanning everything", args: [[9, 1, 8], 3], expected: [9] },
      {
        type: "call",
        name: "strictly decreasing input",
        args: [[9, 8, 7, 6, 5], 2],
        expected: [9, 8, 7, 6],
      },
      {
        type: "call",
        name: "duplicates keep the window honest",
        args: [[2, 2, 2, 1, 2], 2],
        expected: [2, 2, 2, 2],
      },
      {
        type: "script",
        name: "linear time on 100k elements (O(n·k) would blow the deadline)",
        script: `
const n = 100000;
const nums = Array.from({ length: n }, (_, i) => (i * 7919) % 1000);
const result = subject(nums, 5000);
t.equal(result.length, n - 5000 + 1);
let max = -Infinity;
for (let i = 0; i < 5000; i++) max = Math.max(max, nums[i]);
t.equal(result[0], max, "first window max");
`,
        timeoutMs: 900,
      },
    ],
  },
  parSeconds: 420, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 1500,
  tags: ["sliding-window", "monotonic-deque", "arrays", "par-unverified"],
});
