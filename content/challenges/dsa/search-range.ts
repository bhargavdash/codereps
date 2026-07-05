import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "search-range",
  title: "First and last position (binary search bounds)",
  category: "dsa",
  mode: "pattern_drill",
  difficulty: 3,
  runner: "js_worker",
  language: "javascript",
  promptMd: `The binary-search variant that interviews actually test: not "is it there," but **where does it start and end**.

- \`searchRange(nums, target)\` returns \`[first, last]\` — the first and last index of \`target\` in the sorted array \`nums\`.
- Return \`[-1, -1]\` when the target is absent.
- Must be O(log n): two biased binary searches (lower bound, upper bound), not a scan outward from a hit.`,
  starterCode: `function searchRange(nums, target) {

}
`,
  solutionCode: `function searchRange(nums, target) {
  const lowerBound = (nums, target) => {
    let lo = 0;
    let hi = nums.length; // exclusive
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  const first = lowerBound(nums, target);
  if (first === nums.length || nums[first] !== target) return [-1, -1];
  const afterLast = lowerBound(nums, target + 1);
  return [first, afterLast - 1];
}
`,
  solutionNotesMd:
    "One lower-bound function answers both questions: first occurrence is `lowerBound(target)`, last is `lowerBound(target + 1) − 1`. The half-open `[lo, hi)` invariant is what makes the loop condition and the `hi = mid` step safe from off-by-ones.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "searchRange",
    cases: [
      { type: "call", name: "range in the middle", args: [[5, 7, 7, 8, 8, 10], 8], expected: [3, 4] },
      { type: "call", name: "absent target", args: [[5, 7, 7, 8, 8, 10], 6], expected: [-1, -1] },
      { type: "call", name: "single occurrence", args: [[1, 3, 5], 3], expected: [1, 1] },
      { type: "call", name: "entire array is the target", args: [[2, 2, 2, 2], 2], expected: [0, 3] },
      { type: "call", name: "empty array", args: [[], 1], expected: [-1, -1] },
      { type: "call", name: "target at both ends absent (smaller)", args: [[3, 4], 1], expected: [-1, -1] },
      {
        type: "script",
        name: "logarithmic on a large plateau",
        script: `
const nums = new Array(500000).fill(7);
nums.unshift(1); nums.push(9);
const result = subject(nums, 7);
t.equal(result, [1, 500000]);
`,
        timeoutMs: 500,
      },
    ],
  },
  parSeconds: 300, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 1200,
  tags: ["binary-search", "arrays", "par-unverified"],
});
