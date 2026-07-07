import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "two-column-grid",
  title: "Sidebar + content grid",
  category: "css",
  mode: "syntax_sprint",
  difficulty: 2,
  runner: "css_iframe",
  language: "css",
  promptMd: `The fixed-sidebar layout, in grid — no floats, no calc.

- \`.layout\` is a grid: a **200px** sidebar column, and a content column taking the rest.
- **16px** gap between the columns.
- The wrapper around \`.layout\` is exactly 600px wide, so the content column computes to 384px (600 − 200 − 16).

Markup (you only write CSS): a 600px wrapper containing \`.layout\` with \`.sidebar\` and \`.content\` children.`,
  starterCode: `.layout {

}
`,
  solutionCode: `.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 16px;
}
`,
  solutionNotesMd:
    "`1fr` means 'a fraction of what's LEFT' — after fixed tracks and gaps are taken out. That's why the content column is 384px here, and why `1fr` beats percentage columns (percentages ignore the gap).",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "css_iframe",
    markup: `<div style="width:600px"><div class="layout"><aside class="sidebar">nav</aside><main class="content">body</main></div></div>`,
    cases: [
      {
        name: "layout is a grid with a 16px gap",
        assertions: [
          { selector: ".layout", property: "display", expected: "grid" },
          { selector: ".layout", property: "column-gap", expected: "16px" },
        ],
      },
      {
        name: "columns resolve to 200px + remaining space",
        assertions: [
          { selector: ".layout", property: "grid-template-columns", expected: "200px 384px" },
        ],
      },
    ],
  },
  parSeconds: 150, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 600,
  tags: ["grid", "layout", "par-unverified"],
});
