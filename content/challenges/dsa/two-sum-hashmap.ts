import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "two-sum-hashmap",
  title: "Two sum (hashmap)",
  category: "dsa",
  mode: "pattern_drill",
  difficulty: 2,
  runner: "js_worker",
  language: "javascript",
  promptMd: `The single-pass hashmap pattern — the O(n²) reflex to unlearn first.

- \`twoSum(nums, target)\` returns the indices \`[i, j]\` (i < j) of the two numbers that add up to \`target\`.
- The array is **unsorted** — do not sort it (that would need to track original indices anyway).
- Exactly one valid pair exists. Single pass: for each number, check if its complement was already seen.`,
  starterCode: `function twoSum(nums, target) {

}
`,
  solutionCode: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}
`,
  solutionNotesMd:
    "The map is built incrementally, one pass — you check for the complement BEFORE inserting the current number, which is what keeps `i < j` true without a second pass or a sort. This is the template every 'find a pair with property X' problem starts from.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "twoSum",
    cases: [
      {
        type: "call",
        name: "basic pair",
        args: [[2, 7, 11, 15], 9],
        expected: [0, 1],
      },
      {
        type: "call",
        name: "pair not adjacent",
        args: [[3, 2, 4], 6],
        expected: [1, 2],
      },
      {
        type: "call",
        name: "duplicate values sum to target",
        args: [[3, 3], 6],
        expected: [0, 1],
      },
      {
        type: "call",
        name: "negative numbers",
        args: [[-3, 4, 3, 90], 0],
        expected: [0, 2],
      },
      {
        type: "script",
        name: "single pass — O(n), not O(n squared)",
        script: `
const big = Array.from({ length: 50000 }, (_, i) => i);
// sequential fill maxes out around 99998 — these two large disjoint values
// are the only pair that can sum to the target, so the result is unambiguous.
big[10] = 1000000;
big[49999] = 2000000;
const start = Date.now();
const result = subject(big, 3000000);
const elapsed = Date.now() - start;
t.ok(elapsed < 900, "must run in a single pass — an O(n squared) scan will blow the time budget on 50k elements (" + elapsed + "ms)");
t.equal(result, [10, 49999]);
`,
      },
    ],
  },
  parSeconds: 150, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 600,
  tags: ["hashmap", "arrays", "par-unverified"],
});
