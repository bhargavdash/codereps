import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "responsive-split",
  title: "Responsive two-up",
  category: "css",
  mode: "syntax_sprint",
  difficulty: 2,
  runner: "css_iframe",
  language: "css",
  promptMd: `The most common responsive move: two columns that stack on small screens.

- \`.split\` is a grid with a \`20px\` gap.
- Wide viewports: **two equal columns** (the 600px wrapper makes each compute to 290px).
- Below a \`600px\` viewport: **one column** (each child computes to the full 600px).

Markup: a 600px wrapper containing \`.split\` with two \`.pane\` children.`,
  starterCode: `.split {

}
`,
  solutionCode: `.split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 600px) {
  .split {
    grid-template-columns: 1fr;
  }
}
`,
  solutionNotesMd:
    "Equal `1fr 1fr` columns split what remains after the gap — (600 − 20) / 2 = 290px each. The media query swaps the whole track list; the children never change, which is the point of grid-driven responsiveness.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "css_iframe",
    markup: `<div style="width:600px"><div class="split"><div class="pane">left</div><div class="pane">right</div></div></div>`,
    cases: [
      {
        name: "grid with a 20px gap",
        assertions: [
          { selector: ".split", property: "display", expected: "grid" },
          { selector: ".split", property: "column-gap", expected: "20px" },
        ],
      },
      {
        name: "wide viewport: two equal 290px columns",
        viewportWidth: 900,
        assertions: [
          { selector: ".split", property: "grid-template-columns", expected: "290px 290px" },
        ],
      },
      {
        name: "narrow viewport: a single column",
        viewportWidth: 420,
        assertions: [
          { selector: ".split", property: "grid-template-columns", expected: "600px" },
        ],
      },
    ],
  },
  parSeconds: 180, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 900,
  tags: ["grid", "media-queries", "par-unverified"],
});
