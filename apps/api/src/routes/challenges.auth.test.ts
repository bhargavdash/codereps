/**
 * Real-middleware auth posture: the challenges endpoints must be unreachable
 * without a valid bearer token. (Data/gating assertions live in
 * challenges.data.test.ts with the middleware mocked.)
 */
import { describe, expect, it } from "vitest";
import request from "supertest";

process.env.SUPABASE_URL ??= "https://example.supabase.co"; // middleware needs a configured URL
const { createApp } = await import("../app.js");

const app = createApp();

describe("challenges auth posture (real requireAuth)", () => {
  it("rejects a missing token with 401", async () => {
    const res = await request(app).get("/api/v1/challenges");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("missing_token");
  });

  it("rejects a malformed token with 401", async () => {
    const res = await request(app)
      .get("/api/v1/challenges/debounce")
      .set("Authorization", "Bearer not-a-jwt");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("invalid_token");
  });
});
