import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "truncate-text",
  title: "Truncate text with an ellipsis",
  category: "css",
  mode: "syntax_sprint",
  difficulty: 1,
  runner: "css_iframe",
  language: "css",
  promptMd: `The three-property incantation you'll type a thousand times.

- \`.label\` is 120px wide and must clip overflowing text to a single line, ending in an ellipsis (\`…\`).
- The text must not wrap to a second line.

The markup (you only write CSS): a \`.label\` div containing a long string of text.`,
  starterCode: `.label {

}
`,
  solutionCode: `.label {
  width: 120px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
`,
  solutionNotesMd:
    "All three properties are required together: `white-space: nowrap` stops the wrap, `overflow: hidden` clips the overflow, and `text-overflow: ellipsis` is purely cosmetic — it does nothing without the other two already clipping the box.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "css_iframe",
    markup: `<div class="label">This is a deliberately long piece of label text that will not fit</div>`,
    cases: [
      {
        name: "label is a fixed-width clipped ellipsis box",
        assertions: [
          { selector: ".label", property: "width", expected: "120px" },
          { selector: ".label", property: "overflow", expected: "hidden" },
          { selector: ".label", property: "white-space", expected: "nowrap" },
          { selector: ".label", property: "text-overflow", expected: "ellipsis" },
        ],
      },
    ],
  },
  parSeconds: 90, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 300,
  tags: ["text", "overflow", "par-unverified"],
});
