import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "merge-intervals",
  title: "Merge intervals",
  category: "dsa",
  mode: "pattern_drill",
  difficulty: 3,
  runner: "js_worker",
  language: "javascript",
  promptMd: `Sort-then-sweep — the pattern behind every "collapse overlapping ranges" problem.

- \`mergeIntervals(intervals)\` takes an array of \`[start, end]\` pairs (unsorted, \`start <= end\`) and returns a new array with all overlapping intervals merged.
- Two intervals overlap if one starts at or before the other ends (touching counts: \`[1,3]\` and \`[3,5]\` merge into \`[1,5]\`).
- Result must be sorted by start, and must not mutate the input.`,
  starterCode: `function mergeIntervals(intervals) {

}
`,
  solutionCode: `function mergeIntervals(intervals) {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [sorted[0].slice()];
  for (let i = 1; i < sorted.length; i++) {
    const [start, end] = sorted[i];
    const last = merged[merged.length - 1];
    if (start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}
`,
  solutionNotesMd:
    "Sorting by start first is what turns 'any pair might overlap' into 'only ever compare against the last merged interval' — a single left-to-right sweep instead of pairwise comparison. `Math.max(last[1], end)` handles the case where an interval is fully swallowed by the one before it.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "mergeIntervals",
    cases: [
      {
        type: "call",
        name: "merges overlapping pairs",
        args: [[[1, 3], [2, 6], [8, 10], [15, 18]]],
        expected: [[1, 6], [8, 10], [15, 18]],
      },
      {
        type: "call",
        name: "touching intervals merge",
        args: [[[1, 4], [4, 5]]],
        expected: [[1, 5]],
      },
      {
        type: "call",
        name: "handles unsorted input",
        args: [[[5, 6], [1, 2], [3, 4]]],
        expected: [[1, 2], [3, 4], [5, 6]],
      },
      {
        type: "call",
        name: "fully nested interval collapses",
        args: [[[1, 10], [2, 3], [4, 5]]],
        expected: [[1, 10]],
      },
      {
        type: "call",
        name: "empty input",
        args: [[]],
        expected: [],
      },
      {
        type: "script",
        name: "does not mutate the input",
        script: `
const input = [[2, 6], [1, 3]];
subject(input);
t.equal(input, [[2, 6], [1, 3]], "input must be untouched");
`,
      },
    ],
  },
  parSeconds: 280, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 900,
  tags: ["sorting", "intervals", "par-unverified"],
});
