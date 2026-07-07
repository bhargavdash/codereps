import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "todo-list",
  title: "Todo list",
  category: "react",
  mode: "component_recall",
  difficulty: 3,
  runner: "react_iframe",
  language: "tsx",
  promptMd: `List state without mutation — the add/remove rep.

- Define a component named \`TodoList\`.
- An \`<input aria-label="new todo">\` and a button labeled \`Add\`.
- Adding: non-empty input becomes an \`<li>\` inside \`<ul data-testid="list">\`, input clears. Empty/whitespace input adds nothing.
- Each \`<li>\` contains its text and a button labeled \`Remove\` that deletes exactly that item.`,
  starterCode: `function TodoList() {

}
`,
  solutionCode: `function TodoList() {
  const [items, setItems] = React.useState<string[]>([]);
  const [draft, setDraft] = React.useState("");

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setItems((prev) => [...prev, text]);
    setDraft("");
  };

  return (
    <div>
      <input aria-label="new todo" value={draft} onChange={(e) => setDraft(e.target.value)} />
      <button onClick={add}>Add</button>
      <ul data-testid="list">
        {items.map((item, i) => (
          <li key={i}>
            {item}
            <button onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
`,
  solutionNotesMd:
    "Every list change is a NEW array (`[...prev, text]`, `prev.filter(...)`) — mutation is the classic silent-stale-UI bug. Index keys are acceptable here because items only append/remove wholesale; know why that caveat exists.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "react_iframe",
    componentName: "TodoList",
    cases: [
      {
        name: "adds an item and clears the input",
        script: `
const input = ctx.dom.getByLabelText("new todo");
ctx.dom.fireEvent.input(input, { target: { value: "stretch" } });
await ctx.tick();
ctx.dom.fireEvent.click(ctx.dom.getByText("Add"));
await ctx.tick();
const items = ctx.dom.getByTestId("list").querySelectorAll("li");
ctx.t.equal(items.length, 1);
ctx.t.ok(items[0].textContent.includes("stretch"));
ctx.t.equal(input.value, "", "input must clear after adding");`,
      },
      {
        name: "ignores empty and whitespace-only input",
        script: `
ctx.dom.fireEvent.click(ctx.dom.getByText("Add"));
await ctx.tick();
const input = ctx.dom.getByLabelText("new todo");
ctx.dom.fireEvent.input(input, { target: { value: "   " } });
await ctx.tick();
ctx.dom.fireEvent.click(ctx.dom.getByText("Add"));
await ctx.tick();
ctx.t.equal(ctx.dom.getByTestId("list").querySelectorAll("li").length, 0);`,
      },
      {
        name: "removes exactly the clicked item",
        script: `
const input = ctx.dom.getByLabelText("new todo");
for (const text of ["a", "b", "c"]) {
  ctx.dom.fireEvent.input(input, { target: { value: text } });
  await ctx.tick();
  ctx.dom.fireEvent.click(ctx.dom.getByText("Add"));
  await ctx.tick();
}
const removeButtons = ctx.dom.getAllByText("Remove");
ctx.dom.fireEvent.click(removeButtons[1]); // remove "b"
await ctx.tick();
const texts = [...ctx.dom.getByTestId("list").querySelectorAll("li")].map((li) => li.textContent.replace("Remove", ""));
ctx.t.equal(texts, ["a", "c"]);`,
      },
    ],
  },
  parSeconds: 360, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 1200,
  tags: ["lists", "immutability", "par-unverified"],
});
