import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "list-filter",
  title: "Live list filter",
  category: "react",
  mode: "component_recall",
  difficulty: 2,
  runner: "react_iframe",
  language: "tsx",
  promptMd: `Derived rendering: filter at render time, don't store what you can compute.

- Define a component named \`CityFilter\` over this fixed list: \`Pune\`, \`Paris\`, \`Lima\`, \`Lagos\`, \`Lisbon\`.
- An \`<input aria-label="filter">\`; the \`<ul data-testid="cities">\` shows only cities whose name contains the query, **case-insensitive**.
- Empty query shows all five.
- When nothing matches, render \`<p data-testid="empty">No matches</p>\` instead of an empty list.`,
  starterCode: `const CITIES = ["Pune", "Paris", "Lima", "Lagos", "Lisbon"];

function CityFilter() {

}
`,
  solutionCode: `const CITIES = ["Pune", "Paris", "Lima", "Lagos", "Lisbon"];

function CityFilter() {
  const [query, setQuery] = React.useState("");
  const visible = CITIES.filter((city) => city.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <input aria-label="filter" value={query} onChange={(e) => setQuery(e.target.value)} />
      {visible.length === 0 ? (
        <p data-testid="empty">No matches</p>
      ) : (
        <ul data-testid="cities">
          {visible.map((city) => (
            <li key={city}>{city}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
`,
  solutionNotesMd:
    "Only the QUERY is state — the filtered list is derived every render. Storing `visible` in state too is the classic double-source-of-truth bug (it desyncs the moment you forget one setter).",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "react_iframe",
    componentName: "CityFilter",
    cases: [
      {
        name: "shows all five initially",
        script: `ctx.t.equal(ctx.dom.getByTestId("cities").querySelectorAll("li").length, 5);`,
      },
      {
        name: "filters case-insensitively",
        script: `
ctx.dom.fireEvent.input(ctx.dom.getByLabelText("filter"), { target: { value: "li" } });
await ctx.tick();
const texts = [...ctx.dom.getByTestId("cities").querySelectorAll("li")].map((li) => li.textContent);
ctx.t.equal(texts, ["Lima", "Lisbon"]);`,
      },
      {
        name: "no matches shows the empty state, not an empty list",
        script: `
ctx.dom.fireEvent.input(ctx.dom.getByLabelText("filter"), { target: { value: "zzz" } });
await ctx.tick();
ctx.t.ok(ctx.dom.getByTestId("empty"));
ctx.t.equal(ctx.dom.queryByTestId("cities"), null);`,
      },
      {
        name: "clearing the query restores the full list",
        script: `
const input = ctx.dom.getByLabelText("filter");
ctx.dom.fireEvent.input(input, { target: { value: "zzz" } });
await ctx.tick();
ctx.dom.fireEvent.input(input, { target: { value: "" } });
await ctx.tick();
ctx.t.equal(ctx.dom.getByTestId("cities").querySelectorAll("li").length, 5);`,
      },
    ],
  },
  parSeconds: 240, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 900,
  tags: ["derived-state", "lists", "par-unverified"],
});
