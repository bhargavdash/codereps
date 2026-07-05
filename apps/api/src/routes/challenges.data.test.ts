/**
 * Solution gating + data contract against the REAL seeded database
 * (architecture will-bite #2: solutionCode must never appear in any
 * pre-submit payload). requireAuth is mocked here — auth posture has its own
 * test file with the real middleware.
 *
 * Skips when DATABASE_URL can't be resolved (e.g. CI without the secret).
 */
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";

loadEnv({ path: fileURLToPath(new URL("../../../../packages/db/.env", import.meta.url)) });

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req: { user?: { id: string } }, _res: unknown, next: () => void) => {
    req.user = { id: "00000000-0000-4000-8000-000000000000" };
    next();
  },
}));

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("challenges API against seeded data", () => {
  let app: Express;
  let db: typeof import("@codereps/db");

  beforeAll(async () => {
    db = await import("@codereps/db");
    const { createApp } = await import("../app.js");
    app = createApp();
    return async () => {
      await db.prisma.$disconnect();
    };
  });

  const FORBIDDEN_KEYS = ["solutionCode", "solutionNotesMd"];

  it("lists seeded challenges as metadata only — no prompt, tests, or solution fields", async () => {
    const res = await request(app).get("/api/v1/challenges?limit=100");
    expect(res.status).toBe(200);
    expect(res.body.challenges.length).toBeGreaterThanOrEqual(10);
    for (const challenge of res.body.challenges) {
      for (const key of [...FORBIDDEN_KEYS, "promptMd", "starterCode", "tests"]) {
        expect(challenge, `list item "${challenge.slug}" must not carry ${key}`).not.toHaveProperty(key);
      }
    }
  });

  it("filters by category and tag", async () => {
    const dsa = await request(app).get("/api/v1/challenges?category=dsa");
    expect(dsa.status).toBe(200);
    expect(dsa.body.challenges.length).toBeGreaterThanOrEqual(4);
    expect(dsa.body.challenges.every((c: { category: string }) => c.category === "dsa")).toBe(true);

    const tagged = await request(app).get("/api/v1/challenges?tag=two-pointer");
    expect(tagged.status).toBe(200);
    expect(tagged.body.challenges.map((c: { slug: string }) => c.slug)).toContain("pair-sum-sorted");
  });

  it("rejects an unknown category with 400", async () => {
    const res = await request(app).get("/api/v1/challenges?category=golang");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("bad_category");
  });

  it("paginates with a stable cursor and no overlap", async () => {
    const first = await request(app).get("/api/v1/challenges?limit=3");
    expect(first.status).toBe(200);
    expect(first.body.challenges).toHaveLength(3);
    expect(first.body.nextCursor).toBeTruthy();

    const second = await request(app).get(
      `/api/v1/challenges?limit=3&cursor=${first.body.nextCursor}`,
    );
    expect(second.status).toBe(200);
    const firstSlugs = new Set(first.body.challenges.map((c: { slug: string }) => c.slug));
    for (const challenge of second.body.challenges) {
      expect(firstSlugs.has(challenge.slug), "pages must not overlap").toBe(false);
    }
  });

  it("serves the practice payload (prompt/starter/tests) but strips the solution", async () => {
    const res = await request(app).get("/api/v1/challenges/debounce");
    expect(res.status).toBe(200);
    const challenge = res.body.challenge;
    expect(challenge.promptMd).toBeTruthy();
    expect(challenge.starterCode).toBeTruthy();
    expect(challenge.tests?.kind).toBe("js_worker");
    for (const key of FORBIDDEN_KEYS) {
      expect(challenge, `detail must not carry ${key}`).not.toHaveProperty(key);
    }
  });

  it("never leaks solution text anywhere in any pre-submit response body (will-bite #2)", async () => {
    const solutions = await db.prisma.challenge.findMany({
      where: { isPublished: true },
      select: { slug: true, solutionCode: true },
    });
    expect(solutions.length).toBeGreaterThanOrEqual(10);

    // the current pre-submit API surface: the list + every detail payload
    const bodies: string[] = [];
    bodies.push((await request(app).get("/api/v1/challenges?limit=100")).text);
    for (const { slug } of solutions) {
      bodies.push((await request(app).get(`/api/v1/challenges/${slug}`)).text);
    }

    for (const { slug, solutionCode } of solutions) {
      // JSON-escape (minus surrounding quotes) so the comparison matches how
      // the string would appear inside a JSON response body
      const needle = JSON.stringify(solutionCode).slice(1, -1);
      for (const body of bodies) {
        expect(body.includes(needle), `solution for "${slug}" leaked into a response`).toBe(false);
      }
    }
  });

  it("404s unknown slugs", async () => {
    const res = await request(app).get("/api/v1/challenges/does-not-exist");
    expect(res.status).toBe(404);
  });
});
