import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "button-reset",
  title: "Style a button from scratch",
  category: "css",
  mode: "syntax_sprint",
  difficulty: 1,
  runner: "css_iframe",
  language: "css",
  promptMd: `Muscle memory for the properties every design system button needs.

- \`.btn\`: no border, \`6px\` corner radius, pointer cursor.
- Padding: \`10px\` vertical, \`20px\` horizontal.
- Type: \`14px\` font size, \`600\` weight.
- \`inline-flex\` display with centered alignment (\`align-items\`, \`justify-content\`).`,
  starterCode: `.btn {

}
`,
  solutionCode: `.btn {
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
`,
  solutionNotesMd:
    "`inline-flex` is the button move: flex centering inside, inline flow outside. The two-value padding shorthand (`10px 20px`) is vertical-then-horizontal — say it out loud until it's automatic.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "css_iframe",
    markup: `<button class="btn">Submit rep</button>`,
    cases: [
      {
        name: "shape: radius, no border, pointer",
        assertions: [
          { selector: ".btn", property: "border-radius", expected: "6px" },
          { selector: ".btn", property: "border-top-width", expected: "0px" },
          { selector: ".btn", property: "cursor", expected: "pointer" },
        ],
      },
      {
        name: "spacing: 10px / 20px padding",
        assertions: [
          { selector: ".btn", property: "padding-top", expected: "10px" },
          { selector: ".btn", property: "padding-left", expected: "20px" },
        ],
      },
      {
        name: "type and centering",
        assertions: [
          { selector: ".btn", property: "font-size", expected: "14px" },
          { selector: ".btn", property: "font-weight", expected: "600" },
          { selector: ".btn", property: "display", expected: "inline-flex" },
          { selector: ".btn", property: "align-items", expected: "center" },
          { selector: ".btn", property: "justify-content", expected: "center" },
        ],
      },
    ],
  },
  parSeconds: 120, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 600,
  tags: ["buttons", "box-model", "par-unverified"],
});
