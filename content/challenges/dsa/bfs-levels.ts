import { defineChallenge, TESTS_SCHEMA_VERSION } from "@codereps/shared";

export default defineChallenge({
  slug: "bfs-levels",
  title: "BFS by levels",
  category: "dsa",
  mode: "pattern_drill",
  difficulty: 3,
  runner: "js_worker",
  language: "javascript",
  promptMd: `Level-order traversal of a graph — the BFS skeleton that level-order tree problems, shortest-path-in-maze, and "minimum steps" problems all reuse.

- \`bfsLevels(graph, start)\` takes an adjacency list (object mapping node → array of neighbor names) and returns an **array of levels**: \`[[start], [nodes at distance 1], [distance 2], …]\`.
- Visit each node once — the graph may contain cycles.
- Within a level, keep the order in which nodes were discovered.
- Nodes unreachable from \`start\` don't appear.`,
  starterCode: `function bfsLevels(graph, start) {

}
`,
  solutionCode: `function bfsLevels(graph, start) {
  const levels = [];
  const visited = new Set([start]);
  let frontier = [start];

  while (frontier.length > 0) {
    levels.push(frontier);
    const next = [];
    for (const node of frontier) {
      for (const neighbor of graph[node] ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          next.push(neighbor);
        }
      }
    }
    frontier = next;
  }
  return levels;
}
`,
  solutionNotesMd:
    "The frontier-swap formulation (process a whole level, build the next) gives you levels for free — no queue-size counting. Mark visited **when enqueuing**, not when dequeuing, or cycles enqueue a node twice.",
  tests: {
    schemaVersion: TESTS_SCHEMA_VERSION,
    kind: "js_worker",
    entryPoint: "bfsLevels",
    cases: [
      {
        type: "call",
        name: "simple tree by levels",
        args: [{ a: ["b", "c"], b: ["d"], c: ["e"], d: [], e: [] }, "a"],
        expected: [["a"], ["b", "c"], ["d", "e"]],
      },
      {
        type: "call",
        name: "cycles don't revisit",
        args: [{ a: ["b"], b: ["c"], c: ["a"] }, "a"],
        expected: [["a"], ["b"], ["c"]],
      },
      {
        type: "call",
        name: "diamond joins at one level",
        args: [{ s: ["l", "r"], l: ["t"], r: ["t"], t: [] }, "s"],
        expected: [["s"], ["l", "r"], ["t"]],
      },
      {
        type: "call",
        name: "unreachable nodes are absent",
        args: [{ a: ["b"], b: [], x: ["y"], y: [] }, "a"],
        expected: [["a"], ["b"]],
      },
      {
        type: "call",
        name: "isolated start node",
        args: [{ a: [] }, "a"],
        expected: [["a"]],
      },
      {
        type: "call",
        name: "discovery order within a level",
        args: [{ s: ["b", "a"], b: ["z"], a: ["y"], z: [], y: [] }, "s"],
        expected: [["s"], ["b", "a"], ["z", "y"]],
      },
    ],
  },
  parSeconds: 300, // PROVISIONAL — recalibrate by solving (will-bite #5)
  timeLimitSeconds: 1200,
  tags: ["bfs", "graphs", "par-unverified"],
});
