import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "pair-sum-sorted",
  title: "Pair sum in a sorted array",
  category: "dsa",
  mode: "pattern_drill",
  difficulty: 2,
  runner: "js_worker",
  language: "javascript",
  promptMd: `The opening move of the two-pointer family: find a pair summing to a target in a **sorted** array, in linear time.

- \`pairSum(nums, target)\` returns the **indices** \`[i, j]\` (\`i < j\`) of one pair whose values add to \`target\`.
- Return \`null\` when no pair exists.
- \`nums\` is sorted ascending and may contain duplicates and negatives.
- One pass, O(1) extra space — no nested loops, no hash map.`,
  starterCode: `function pairSum(nums, target) {

}
`,
  solutionCode: `function pairSum(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left += 1;
    else right -= 1;
  }
  return null;
}
`,
  solutionNotesMd:
    "Sortedness is the whole trick: a too-small sum can only be fixed by moving `left` up, a too-big sum only by moving `right` down. Each step permanently discards one element, hence O(n).",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "pairSum",
    cases: [
      { type: "call", name: "finds a middle pair", args: [[1, 3, 4, 6, 8, 11], 10], expected: [2, 3] },
      { type: "call", name: "finds the outermost pair", args: [[2, 5, 9, 11], 13], expected: [0, 3] },
      { type: "call", name: "handles negatives", args: [[-5, -2, 0, 3, 7], 1], expected: [1, 3] },
      { type: "call", name: "returns null when no pair exists", args: [[1, 2, 3], 100], expected: null },
      { type: "call", name: "two elements exactly", args: [[4, 6], 10], expected: [0, 1] },
      {
        type: "script",
        name: "stays linear on a large input",
        script: `
const n = 200000;
const nums = Array.from({ length: n }, (_, i) => i * 2);
const result = subject(nums, (n - 2) * 2 + 0); // pair of first and last-ish
t.ok(Array.isArray(result), "must find a pair");
t.equal(nums[result[0]] + nums[result[1]], (n - 2) * 2, "values sum to target");
`,
        timeoutMs: 500,
      },
    ],
  },
  parSeconds: 180, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 600,
  tags: ["two-pointer", "arrays", "par-unverified"],
});
