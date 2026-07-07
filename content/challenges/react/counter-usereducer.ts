import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "counter-usereducer",
  title: "Counter with useReducer",
  category: "react",
  mode: "component_recall",
  difficulty: 2,
  runner: "react_iframe",
  language: "tsx",
  promptMd: `Build a counter driven by \`useReducer\` — the reducer pattern from memory, no cheating with three \`useState\`s.

- Define a component named \`Counter\`. React is available as a global (\`React.useReducer\`); there are no imports in a rep.
- Render the current count in an element with \`data-testid="count"\`, starting at 0.
- Three buttons, labeled exactly \`+\`, \`-\`, and \`Reset\`.
- All state transitions go through one reducer: increment, decrement (negatives allowed), reset to 0.`,
  starterCode: `function Counter() {
  // one reducer, three actions

}
`,
  solutionCode: `function Counter() {
  const [count, dispatch] = React.useReducer(
    (state: number, action: { type: "increment" | "decrement" | "reset" }) => {
      switch (action.type) {
        case "increment":
          return state + 1;
        case "decrement":
          return state - 1;
        case "reset":
          return 0;
      }
    },
    0,
  );
  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
    </div>
  );
}
`,
  solutionNotesMd:
    "The reducer owns every transition — the buttons only *name* what happened. That inversion (events describe, reducer decides) is the whole point of the pattern, and it's what makes the jump to Redux/Zustand reducers feel familiar.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "react_iframe",
    componentName: "Counter",
    cases: [
      {
        name: "renders with the count at 0",
        script: `ctx.t.equal(ctx.dom.getByTestId("count").textContent, "0");`,
      },
      {
        name: "+ increments",
        script: `
const plus = ctx.dom.getByText("+");
ctx.dom.fireEvent.click(plus);
ctx.dom.fireEvent.click(plus);
ctx.dom.fireEvent.click(plus);
await ctx.tick();
ctx.t.equal(ctx.dom.getByTestId("count").textContent, "3");`,
      },
      {
        name: "- decrements below zero",
        script: `
const minus = ctx.dom.getByText("-");
ctx.dom.fireEvent.click(minus);
ctx.dom.fireEvent.click(minus);
await ctx.tick();
ctx.t.equal(ctx.dom.getByTestId("count").textContent, "-2");`,
      },
      {
        name: "Reset returns to 0 after activity",
        script: `
const plus = ctx.dom.getByText("+");
ctx.dom.fireEvent.click(plus);
ctx.dom.fireEvent.click(plus);
await ctx.tick();
ctx.dom.fireEvent.click(ctx.dom.getByText("Reset"));
await ctx.tick();
ctx.t.equal(ctx.dom.getByTestId("count").textContent, "0");`,
      },
    ],
  },
  parSeconds: 300, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 1200,
  tags: ["usereducer", "hooks", "par-unverified"],
});
