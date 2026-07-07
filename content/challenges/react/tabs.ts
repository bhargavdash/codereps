import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "tabs",
  title: "Tabs",
  category: "react",
  mode: "component_recall",
  difficulty: 2,
  runner: "react_iframe",
  language: "tsx",
  promptMd: `One piece of state, N views — the selection pattern.

- Define a component named \`Tabs\`.
- Three tab buttons labeled exactly \`Home\`, \`Stats\`, \`Settings\`.
- A single \`<div data-testid="panel">\` shows the active tab's content: \`Home content\`, \`Stats content\`, or \`Settings content\`.
- \`Home\` is active initially. The active tab's button has \`aria-selected="true"\`, the others \`"false"\`.`,
  starterCode: `function Tabs() {

}
`,
  solutionCode: `function Tabs() {
  const tabs = ["Home", "Stats", "Settings"] as const;
  const [active, setActive] = React.useState<(typeof tabs)[number]>("Home");
  return (
    <div>
      {tabs.map((tab) => (
        <button key={tab} aria-selected={tab === active} onClick={() => setActive(tab)}>
          {tab}
        </button>
      ))}
      <div data-testid="panel">{active} content</div>
    </div>
  );
}
`,
  solutionNotesMd:
    "Store WHICH tab is active, never three booleans — one value can't be contradictory. Everything else (panel text, aria-selected) derives from it at render time.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "react_iframe",
    componentName: "Tabs",
    cases: [
      {
        name: "Home is active initially",
        script: `
ctx.t.equal(ctx.dom.getByTestId("panel").textContent, "Home content");
ctx.t.equal(ctx.dom.getByText("Home").getAttribute("aria-selected"), "true");`,
      },
      {
        name: "clicking a tab switches the panel",
        script: `
ctx.dom.fireEvent.click(ctx.dom.getByText("Stats"));
await ctx.tick();
ctx.t.equal(ctx.dom.getByTestId("panel").textContent, "Stats content");`,
      },
      {
        name: "aria-selected follows the active tab",
        script: `
ctx.dom.fireEvent.click(ctx.dom.getByText("Settings"));
await ctx.tick();
ctx.t.equal(ctx.dom.getByText("Settings").getAttribute("aria-selected"), "true");
ctx.t.equal(ctx.dom.getByText("Home").getAttribute("aria-selected"), "false");
ctx.t.equal(ctx.dom.getByText("Stats").getAttribute("aria-selected"), "false");`,
      },
      {
        name: "only one panel exists at a time",
        script: `
ctx.dom.fireEvent.click(ctx.dom.getByText("Stats"));
await ctx.tick();
ctx.t.equal(ctx.container.querySelectorAll('[data-testid="panel"]').length, 1);
ctx.t.equal(ctx.dom.queryByText("Home content"), null);`,
      },
    ],
  },
  parSeconds: 240, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 900,
  tags: ["state-modeling", "aria", "par-unverified"],
});
