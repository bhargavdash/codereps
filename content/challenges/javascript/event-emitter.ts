import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "event-emitter",
  title: "Event emitter",
  category: "javascript",
  mode: "pattern_drill",
  difficulty: 3,
  runner: "js_worker",
  language: "javascript",
  promptMd: `The pub/sub backbone — every framework has one; write yours from memory.

- \`createEmitter()\` returns an object with \`on\`, \`off\`, and \`emit\`.
- \`on(event, handler)\`: register; the same handler can listen to many events.
- \`emit(event, ...args)\`: call that event's handlers **in registration order** with the args.
- \`off(event, handler)\`: remove that one handler; other handlers stay.
- Emitting an event with no listeners is a no-op, not an error.`,
  starterCode: `function createEmitter() {

}
`,
  solutionCode: `function createEmitter() {
  const handlers = new Map();
  return {
    on(event, handler) {
      if (!handlers.has(event)) handlers.set(event, []);
      handlers.get(event).push(handler);
    },
    off(event, handler) {
      const list = handlers.get(event);
      if (!list) return;
      const index = list.indexOf(handler);
      if (index !== -1) list.splice(index, 1);
    },
    emit(event, ...args) {
      for (const handler of handlers.get(event) ?? []) {
        handler(...args);
      }
    },
  };
}
`,
  solutionNotesMd:
    "A Map of event → handler array is the whole structure. `off` removes by identity (`indexOf` the function reference) — which is why callers must keep the same reference they registered, the exact gotcha behind React's 'why won't my removeEventListener work'.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "createEmitter",
    cases: [
      {
        type: "script",
        name: "delivers events with arguments",
        script: `
const emitter = subject();
const handler = t.spy();
emitter.on("rep:done", handler);
emitter.emit("rep:done", "debounce", 92);
t.equal(handler.callCount, 1);
t.equal(handler.calls[0], ["debounce", 92]);`,
      },
      {
        type: "script",
        name: "multiple handlers fire in registration order",
        script: `
const emitter = subject();
const order = [];
emitter.on("go", () => order.push("first"));
emitter.on("go", () => order.push("second"));
emitter.emit("go");
t.equal(order, ["first", "second"]);`,
      },
      {
        type: "script",
        name: "off removes only that handler",
        script: `
const emitter = subject();
const keep = t.spy();
const drop = t.spy();
emitter.on("tick", keep);
emitter.on("tick", drop);
emitter.off("tick", drop);
emitter.emit("tick");
t.equal(keep.callCount, 1);
t.equal(drop.callCount, 0);`,
      },
      {
        type: "script",
        name: "events are isolated from each other",
        script: `
const emitter = subject();
const a = t.spy();
emitter.on("a", a);
emitter.emit("b");
t.equal(a.callCount, 0, "emitting b must not fire a's handlers");`,
      },
      {
        type: "script",
        name: "emitting with no listeners is a no-op",
        script: `
const emitter = subject();
emitter.emit("ghost");
emitter.off("ghost", () => {});
t.ok(true, "no throw");`,
      },
    ],
  },
  parSeconds: 300, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 1200,
  tags: ["pub-sub", "closures", "par-unverified"],
});
