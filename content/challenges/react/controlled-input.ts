import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "controlled-input",
  title: "Controlled input with live echo",
  category: "react",
  mode: "component_recall",
  difficulty: 2,
  runner: "react_iframe",
  language: "tsx",
  promptMd: `The controlled-component contract, from memory.

- Define a component named \`Echo\`.
- One text \`<input>\` with \`aria-label="message"\`, fully controlled (its \`value\` comes from state).
- A \`<p data-testid="echo">\` mirrors the input's current text.
- A \`<span data-testid="count">\` shows the character count, starting at \`0\`.`,
  starterCode: `function Echo() {

}
`,
  solutionCode: `function Echo() {
  const [text, setText] = React.useState("");
  return (
    <div>
      <input aria-label="message" value={text} onChange={(e) => setText(e.target.value)} />
      <p data-testid="echo">{text}</p>
      <span data-testid="count">{text.length}</span>
    </div>
  );
}
`,
  solutionNotesMd:
    "Controlled means the DOM never owns the value — `value={text}` + `onChange` makes React the single source of truth, which is what lets everything else (echo, count) derive instead of sync.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "react_iframe",
    componentName: "Echo",
    cases: [
      {
        name: "starts empty with count 0",
        script: `
ctx.t.equal(ctx.dom.getByTestId("echo").textContent, "");
ctx.t.equal(ctx.dom.getByTestId("count").textContent, "0");`,
      },
      {
        name: "typing mirrors into the echo",
        script: `
const input = ctx.dom.getByLabelText("message");
ctx.dom.fireEvent.input(input, { target: { value: "reps" } });
await ctx.tick();
ctx.t.equal(ctx.dom.getByTestId("echo").textContent, "reps");
ctx.t.equal(ctx.dom.getByTestId("count").textContent, "4");`,
      },
      {
        name: "the input is controlled (value tracks state)",
        script: `
const input = ctx.dom.getByLabelText("message");
ctx.dom.fireEvent.input(input, { target: { value: "abc" } });
await ctx.tick();
ctx.t.equal(input.value, "abc", "input value must reflect state");`,
      },
    ],
  },
  parSeconds: 180, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 900,
  tags: ["controlled-components", "forms", "par-unverified"],
});
