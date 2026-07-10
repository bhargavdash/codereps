import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "star-rating",
  title: "Star rating",
  category: "react",
  mode: "component_recall",
  difficulty: 2,
  runner: "react_iframe",
  language: "tsx",
  promptMd: `Click-only rating widget — the version you'll actually be asked to build, no hover-preview required.

- Define a component named \`StarRating\`. No props; starts at rating \`0\`.
- Render 5 buttons: \`<button data-star="1">\` through \`<button data-star="5">\`.
- Each button carries \`data-filled="true"\` if its number is \`<=\` the current rating, else \`data-filled="false"\`.
- Clicking a star sets the rating to that star's number — including lowering it.`,
  starterCode: `function StarRating() {

}
`,
  solutionCode: `function StarRating() {
  const [rating, setRating] = React.useState(0);
  return (
    <div>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} data-star={n} data-filled={n <= rating} onClick={() => setRating(n)}>
          ★
        </button>
      ))}
    </div>
  );
}
`,
  solutionNotesMd:
    "`data-filled={n <= rating}` reads as one comparison per star instead of tracking five booleans — the derived-state habit worth drilling. Clicking a lower star to reduce the rating just works because `setRating(n)` always overwrites, never toggles.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "react_iframe",
    componentName: "StarRating",
    cases: [
      {
        name: "starts with no stars filled",
        script: `
const stars = ctx.container.querySelectorAll("[data-star]");
ctx.t.equal(stars.length, 5, "must render exactly 5 stars");
for (const star of stars) {
  ctx.t.equal(star.getAttribute("data-filled"), "false", "must start unfilled");
}`,
      },
      {
        name: "clicking the 3rd star fills stars 1-3 only",
        script: `
const stars = ctx.container.querySelectorAll("[data-star]");
ctx.dom.fireEvent.click(stars[2]);
await ctx.tick();
const filled = [...ctx.container.querySelectorAll("[data-star]")].map((s) => s.getAttribute("data-filled"));
ctx.t.equal(filled, ["true", "true", "true", "false", "false"]);`,
      },
      {
        name: "clicking a lower star reduces the rating",
        script: `
const stars = ctx.container.querySelectorAll("[data-star]");
ctx.dom.fireEvent.click(stars[4]);
await ctx.tick();
ctx.dom.fireEvent.click(stars[1]);
await ctx.tick();
const filled = [...ctx.container.querySelectorAll("[data-star]")].map((s) => s.getAttribute("data-filled"));
ctx.t.equal(filled, ["true", "true", "false", "false", "false"]);`,
      },
    ],
  },
  parSeconds: 180, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 600,
  tags: ["usestate", "derived-state", "par-unverified"],
});
