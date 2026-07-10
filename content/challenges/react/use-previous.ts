import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "use-previous",
  title: "usePrevious hook",
  category: "react",
  mode: "pattern_drill",
  difficulty: 3,
  runner: "react_iframe",
  language: "tsx",
  promptMd: `The ref-lags-a-render-behind trick, generalized into a hook.

- Define a hook \`usePrevious(value)\` that returns the value from the **previous** render (\`undefined\` on the first render).
- Define a component named \`Tracker\` with a single \`data-testid="value"\` prop-less button that increments an internal counter (starting at 0) on click, and renders \`current: <n> · previous: <p or "undefined">\` as its text content, using \`usePrevious\` internally.`,
  starterCode: `function usePrevious(value) {

}

function Tracker() {

}
`,
  solutionCode: `function usePrevious(value) {
  const ref = React.useRef(undefined);
  React.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function Tracker() {
  const [count, setCount] = React.useState(0);
  const previous = usePrevious(count);
  return (
    <button data-testid="value" onClick={() => setCount((c) => c + 1)}>
      current: {count} · previous: {previous === undefined ? "undefined" : previous}
    </button>
  );
}
`,
  solutionNotesMd:
    "The effect runs AFTER the render commits, so `ref.current` still holds last render's value while the current render reads it — that one-render lag is the entire mechanism. Writing to the ref during render (instead of inside `useEffect`) would collapse `previous` and `current` into the same value.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "react_iframe",
    componentName: "Tracker",
    cases: [
      {
        name: "first render has no previous value",
        script: `
const el = ctx.dom.getByTestId("value");
ctx.t.ok(el.textContent.includes("current: 0"));
ctx.t.ok(el.textContent.includes("previous: undefined"));`,
      },
      {
        name: "after one click, previous lags by one render",
        script: `
const el = ctx.dom.getByTestId("value");
ctx.dom.fireEvent.click(el);
await ctx.tick();
ctx.t.ok(el.textContent.includes("current: 1"));
ctx.t.ok(el.textContent.includes("previous: 0"));`,
      },
      {
        name: "after a second click, previous tracks the prior current",
        script: `
const el = ctx.dom.getByTestId("value");
ctx.dom.fireEvent.click(el);
await ctx.tick();
ctx.dom.fireEvent.click(el);
await ctx.tick();
ctx.t.ok(el.textContent.includes("current: 2"));
ctx.t.ok(el.textContent.includes("previous: 1"));`,
      },
    ],
  },
  parSeconds: 300, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 900,
  tags: ["custom-hooks", "useref", "useeffect", "par-unverified"],
});
