import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "toggle-visibility",
  title: "Toggle visibility",
  category: "react",
  mode: "component_recall",
  difficulty: 1,
  runner: "react_iframe",
  language: "tsx",
  promptMd: `The smallest stateful rep — conditional rendering from memory.

- Define a component named \`Panel\` (React is a global; no imports).
- A button labeled exactly \`Toggle\`.
- A \`<div data-testid="panel">\` containing the text \`Secret plans\` that is **not in the DOM** initially and appears after a click; every click flips it.`,
  starterCode: `function Panel() {

}
`,
  solutionCode: `function Panel() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}>Toggle</button>
      {open && <div data-testid="panel">Secret plans</div>}
    </div>
  );
}
`,
  solutionNotesMd:
    "`{open && <div/>}` unmounts the node — different from hiding with CSS. The functional updater `setOpen(o => !o)` is the habit worth drilling: it never reads a stale closure.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "react_iframe",
    componentName: "Panel",
    cases: [
      {
        name: "panel is absent initially",
        script: `ctx.t.equal(ctx.dom.queryByTestId("panel"), null, "must start hidden (not in the DOM)");`,
      },
      {
        name: "one click reveals it",
        script: `
ctx.dom.fireEvent.click(ctx.dom.getByText("Toggle"));
await ctx.tick();
ctx.t.ok(ctx.dom.getByTestId("panel").textContent.includes("Secret plans"));`,
      },
      {
        name: "a second click hides it again",
        script: `
const btn = ctx.dom.getByText("Toggle");
ctx.dom.fireEvent.click(btn);
await ctx.tick();
ctx.dom.fireEvent.click(btn);
await ctx.tick();
ctx.t.equal(ctx.dom.queryByTestId("panel"), null);`,
      },
    ],
  },
  parSeconds: 120, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 600,
  tags: ["usestate", "conditional-rendering", "par-unverified"],
});
