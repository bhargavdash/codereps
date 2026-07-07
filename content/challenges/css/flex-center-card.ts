import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "flex-center-card",
  title: "Center a card with flexbox",
  category: "css",
  mode: "syntax_sprint",
  difficulty: 1,
  runner: "css_iframe",
  language: "css",
  promptMd: `The centering rep — write it until your fingers know it.

- \`.stage\` is 300px tall and must center \`.card\` both horizontally and vertically using flexbox.
- \`.card\` is exactly 120px wide with an 8px corner radius.
- Below a 500px viewport, \`.stage\` stacks its content in a column instead of a row.

The markup (you only write CSS): a \`.stage\` div containing a \`.card\` div.`,
  starterCode: `.stage {

}

.card {

}
`,
  solutionCode: `.stage {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.card {
  width: 120px;
  border-radius: 8px;
}

@media (max-width: 500px) {
  .stage {
    flex-direction: column;
  }
}
`,
  solutionNotesMd:
    "`justify-content` works along the main axis, `align-items` across it — which is why the same two lines center in both directions only when you remember which axis is which. When the media query flips `flex-direction`, those two axes swap jobs.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "css_iframe",
    markup: `<div class="stage"><div class="card">Ship it</div></div>`,
    cases: [
      {
        name: "stage is a centering flexbox",
        assertions: [
          { selector: ".stage", property: "display", expected: "flex" },
          { selector: ".stage", property: "justify-content", expected: "center" },
          { selector: ".stage", property: "align-items", expected: "center" },
          { selector: ".stage", property: "height", expected: "300px" },
        ],
      },
      {
        name: "card holds its size and radius",
        assertions: [
          { selector: ".card", property: "width", expected: "120px" },
          { selector: ".card", property: "border-radius", expected: "8px" },
        ],
      },
      {
        name: "wide viewport keeps a row",
        viewportWidth: 800,
        assertions: [{ selector: ".stage", property: "flex-direction", expected: "row" }],
      },
      {
        name: "narrow viewport stacks a column",
        viewportWidth: 420,
        assertions: [{ selector: ".stage", property: "flex-direction", expected: "column" }],
      },
    ],
  },
  parSeconds: 150, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 600,
  tags: ["flexbox", "layout", "par-unverified"],
});
