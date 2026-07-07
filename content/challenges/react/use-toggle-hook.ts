import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "use-toggle-hook",
  title: "Extract a useToggle hook",
  category: "react",
  mode: "pattern_drill",
  difficulty: 3,
  runner: "react_iframe",
  language: "tsx",
  promptMd: `Custom-hook extraction — the reuse move interviews love.

- Write a hook \`useToggle(initial)\` returning a tuple \`[value, toggle]\` where \`toggle()\` flips the boolean.
- Then a component named \`Lights\` that calls \`useToggle(false)\` **twice** — two independent switches.
- Each switch: a button (\`Kitchen\`, \`Porch\`) and a status span (\`data-testid="kitchen"\`, \`data-testid="porch"\`) reading \`on\` or \`off\`.
- Flipping one must not affect the other.`,
  starterCode: `function useToggle(initial: boolean) {

}

function Lights() {

}
`,
  solutionCode: `function useToggle(initial: boolean): [boolean, () => void] {
  const [value, setValue] = React.useState(initial);
  const toggle = React.useCallback(() => setValue((v) => !v), []);
  return [value, toggle];
}

function Lights() {
  const [kitchen, toggleKitchen] = useToggle(false);
  const [porch, togglePorch] = useToggle(false);
  return (
    <div>
      <button onClick={toggleKitchen}>Kitchen</button>
      <span data-testid="kitchen">{kitchen ? "on" : "off"}</span>
      <button onClick={togglePorch}>Porch</button>
      <span data-testid="porch">{porch ? "on" : "off"}</span>
    </div>
  );
}
`,
  solutionNotesMd:
    "A custom hook is just a function that calls hooks — each CALL gets its own state slot, which is why two `useToggle(false)` calls are independent. The `useCallback` keeps the toggle referentially stable for consumers that memo on it.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "react_iframe",
    componentName: "Lights",
    cases: [
      {
        name: "both start off",
        script: `
ctx.t.equal(ctx.dom.getByTestId("kitchen").textContent, "off");
ctx.t.equal(ctx.dom.getByTestId("porch").textContent, "off");`,
      },
      {
        name: "toggling flips on and off",
        script: `
const btn = ctx.dom.getByText("Kitchen");
ctx.dom.fireEvent.click(btn);
await ctx.tick();
ctx.t.equal(ctx.dom.getByTestId("kitchen").textContent, "on");
ctx.dom.fireEvent.click(btn);
await ctx.tick();
ctx.t.equal(ctx.dom.getByTestId("kitchen").textContent, "off");`,
      },
      {
        name: "the two switches are independent state",
        script: `
ctx.dom.fireEvent.click(ctx.dom.getByText("Porch"));
await ctx.tick();
ctx.t.equal(ctx.dom.getByTestId("porch").textContent, "on");
ctx.t.equal(ctx.dom.getByTestId("kitchen").textContent, "off", "kitchen must be untouched");`,
      },
    ],
  },
  parSeconds: 300, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 1200,
  tags: ["custom-hooks", "hooks", "par-unverified"],
});
