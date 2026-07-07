import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "accordion",
  title: "Single-open accordion",
  category: "react",
  mode: "component_recall",
  difficulty: 3,
  runner: "react_iframe",
  language: "tsx",
  promptMd: `Exclusive selection with a twist: everything can also be closed.

- Define a component named \`Accordion\`.
- Three section buttons labeled exactly \`One\`, \`Two\`, \`Three\`.
- Each section's body (\`One body\`, \`Two body\`, \`Three body\`) is in the DOM only while its section is open.
- **At most one section is open**: opening a section closes the others; clicking the open section's button closes it (all closed is a valid state — and the initial one).`,
  starterCode: `function Accordion() {

}
`,
  solutionCode: `function Accordion() {
  const sections = ["One", "Two", "Three"] as const;
  const [open, setOpen] = React.useState<string | null>(null);
  return (
    <div>
      {sections.map((section) => (
        <div key={section}>
          <button onClick={() => setOpen((prev) => (prev === section ? null : section))}>
            {section}
          </button>
          {open === section && <div>{section} body</div>}
        </div>
      ))}
    </div>
  );
}
`,
  solutionNotesMd:
    "The state is `string | null` — the null arm IS the feature. `setOpen(prev => prev === section ? null : section)` handles open, switch, and close in one expression because the state models the constraint (≤1 open) instead of policing it.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "react_iframe",
    componentName: "Accordion",
    cases: [
      {
        name: "starts fully closed",
        script: `
for (const body of ["One body", "Two body", "Three body"]) {
  ctx.t.equal(ctx.dom.queryByText(body), null, body + " must not render initially");
}`,
      },
      {
        name: "opening a section shows only that body",
        script: `
ctx.dom.fireEvent.click(ctx.dom.getByText("Two"));
await ctx.tick();
ctx.t.ok(ctx.dom.getByText("Two body"));
ctx.t.equal(ctx.dom.queryByText("One body"), null);`,
      },
      {
        name: "opening another closes the first",
        script: `
ctx.dom.fireEvent.click(ctx.dom.getByText("One"));
await ctx.tick();
ctx.dom.fireEvent.click(ctx.dom.getByText("Three"));
await ctx.tick();
ctx.t.ok(ctx.dom.getByText("Three body"));
ctx.t.equal(ctx.dom.queryByText("One body"), null, "only one section open at a time");`,
      },
      {
        name: "clicking the open section closes it",
        script: `
const btn = ctx.dom.getByText("Two");
ctx.dom.fireEvent.click(btn);
await ctx.tick();
ctx.dom.fireEvent.click(btn);
await ctx.tick();
ctx.t.equal(ctx.dom.queryByText("Two body"), null);`,
      },
    ],
  },
  parSeconds: 300, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 1200,
  tags: ["state-modeling", "conditional-rendering", "par-unverified"],
});
