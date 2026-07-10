import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "valid-parentheses",
  title: "Valid parentheses",
  category: "dsa",
  mode: "syntax_sprint",
  difficulty: 2,
  runner: "js_worker",
  language: "javascript",
  promptMd: `The stack pattern in its purest form.

- \`isValid(s)\` returns \`true\` if every bracket in \`s\` (made only of \`()[]{}\`) is closed by the matching type, in the correct order.
- An empty string is valid.
- A closing bracket with nothing open, or the wrong type open, makes it invalid.`,
  starterCode: `function isValid(s) {

}
`,
  solutionCode: `function isValid(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const char of s) {
    if (char === "(" || char === "[" || char === "{") {
      stack.push(char);
    } else {
      if (stack.pop() !== pairs[char]) return false;
    }
  }
  return stack.length === 0;
}
`,
  solutionNotesMd:
    "Push openers, and on every closer pop-and-compare against the map of expected opener — mismatched types AND unmatched closers both fail the same `!==` check. The final `stack.length === 0` catches openers that were never closed, which the loop alone can't see.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "isValid",
    cases: [
      { type: "call", name: "simple valid pair", args: ["()"], expected: true },
      { type: "call", name: "mixed valid nesting", args: ["([{}])"], expected: true },
      { type: "call", name: "wrong order", args: ["(]"], expected: false },
      { type: "call", name: "wrong type closes", args: ["([)]"], expected: false },
      { type: "call", name: "unclosed opener", args: ["((("], expected: false },
      { type: "call", name: "unmatched closer", args: [")"], expected: false },
      { type: "call", name: "empty string is valid", args: [""], expected: true },
      { type: "call", name: "sequential groups", args: ["()[]{}"], expected: true },
    ],
  },
  parSeconds: 150, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 600,
  tags: ["stack", "strings", "par-unverified"],
});
