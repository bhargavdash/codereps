/**
 * S5 integration: SRS scheduling through the submit transaction, warmup v2
 * (reviews first, day-stable via WarmupSession), /me/summary readiness math,
 * and the heatmap range scan. Real DB; dedicated test user, fully cleaned.
 */
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";

loadEnv({ path: fileURLToPath(new URL("../../../../packages/db/.env", import.meta.url)) });

const TEST_USER = "22222222-3333-4444-8555-666666666666";

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req: { user?: { id: string } }, _res: unknown, next: () => void) => {
    req.user = { id: TEST_USER };
    next();
  },
}));

const hasDb = Boolean(process.env.DATABASE_URL);
const metrics = { keystrokes: 10, pasteAttempts: 0 };
const passResults = (n: number) => ({
  status: "passed" as const,
  casesPassed: n,
  casesTotal: n,
  cases: [],
});

describe.skipIf(!hasDb)("S5: srs + warmup v2 + summary + heatmap", { timeout: 90_000 }, () => {
  let app: Express;
  let db: typeof import("@codereps/db");

  async function cleanup(): Promise<void> {
    const { prisma } = db;
    await prisma.submission.deleteMany({ where: { userId: TEST_USER } });
    await prisma.attempt.deleteMany({ where: { userId: TEST_USER } });
    await prisma.userChallengeProgress.deleteMany({ where: { userId: TEST_USER } });
    await prisma.dailyActivity.deleteMany({ where: { userId: TEST_USER } });
    await prisma.streak.deleteMany({ where: { userId: TEST_USER } });
    await prisma.warmupSession.deleteMany({ where: { userId: TEST_USER } });
    await prisma.profile.deleteMany({ where: { id: TEST_USER } });
  }

  beforeAll(async () => {
    db = await import("@codereps/db");
    const { createApp } = await import("../app.js");
    app = createApp();
    await cleanup();
    await db.prisma.profile.create({
      data: { id: TEST_USER, username: `s5_test_${TEST_USER.slice(0, 6)}`, timezone: "Asia/Kolkata" },
    });
  });

  afterAll(async () => {
    await cleanup();
    await db.prisma.$disconnect();
  });

  async function submitPass(slug: string): Promise<void> {
    const challenge = await db.prisma.challenge.findUniqueOrThrow({ where: { slug } });
    const attempt = await db.prisma.attempt.create({
      data: { userId: TEST_USER, challengeId: challenge.id },
    });
    const res = await request(app)
      .post(`/api/v1/attempts/${attempt.id}/submit`)
      .send({ code: "// s5", clientResults: passResults(4), metrics });
    expect(res.status).toBe(200);
  }

  it("a fresh user's warmup is 3 unseen D1 reps, identical on re-request", async () => {
    const first = await request(app).get("/api/v1/warmup");
    expect(first.status).toBe(200);
    expect(first.body.reps).toHaveLength(3);
    for (const rep of first.body.reps) {
      expect(rep.kind).toBe("new");
      expect(rep.challenge.difficulty).toBe(1); // ramp = floor(0/25)+1
      expect(rep.done).toBe(false);
    }
    const second = await request(app).get("/api/v1/warmup");
    expect(second.body.reps.map((r: { challenge: { slug: string } }) => r.challenge.slug)).toEqual(
      first.body.reps.map((r: { challenge: { slug: string } }) => r.challenge.slug),
    );
  });

  it("submit updates SRS: ladder 1 → 3 and a future nextReviewAt", async () => {
    await submitPass("flatten");
    const challenge = await db.prisma.challenge.findUniqueOrThrow({ where: { slug: "flatten" } });
    let progress = await db.prisma.userChallengeProgress.findUniqueOrThrow({
      where: { userId_challengeId: { userId: TEST_USER, challengeId: challenge.id } },
    });
    expect(progress.srsIntervalDays).toBe(1);
    expect(progress.nextReviewAt!.getTime()).toBeGreaterThan(Date.now());
    expect(progress.lastPassedAt).not.toBeNull();

    await submitPass("flatten");
    progress = await db.prisma.userChallengeProgress.findUniqueOrThrow({
      where: { userId_challengeId: { userId: TEST_USER, challengeId: challenge.id } },
    });
    expect(progress.srsIntervalDays).toBe(3);
  });

  it("a fail resets the interval and dents ease; abandon leaves SRS alone", async () => {
    const challenge = await db.prisma.challenge.findUniqueOrThrow({ where: { slug: "flatten" } });
    const attempt = await db.prisma.attempt.create({
      data: { userId: TEST_USER, challengeId: challenge.id },
    });
    await request(app).post(`/api/v1/attempts/${attempt.id}/submit`).send({
      code: "//",
      clientResults: { status: "failed", casesPassed: 1, casesTotal: 6, cases: [] },
      metrics,
    });
    let progress = await db.prisma.userChallengeProgress.findUniqueOrThrow({
      where: { userId_challengeId: { userId: TEST_USER, challengeId: challenge.id } },
    });
    expect(progress.srsIntervalDays).toBe(1);
    expect(Number(progress.srsEase)).toBeCloseTo(2.4, 2); // 2.5 +0.05×2 (two ≥90 passes) − 0.2

    const before = progress.nextReviewAt!.getTime();
    const attempt2 = await db.prisma.attempt.create({
      data: { userId: TEST_USER, challengeId: challenge.id },
    });
    await request(app).post(`/api/v1/attempts/${attempt2.id}/abandon`).send({ code: "", metrics });
    progress = await db.prisma.userChallengeProgress.findUniqueOrThrow({
      where: { userId_challengeId: { userId: TEST_USER, challengeId: challenge.id } },
    });
    expect(progress.nextReviewAt!.getTime()).toBe(before);
  });

  it("warmup v2 puts due reviews first and stays stable after completing one", async () => {
    // make flatten due and cut a fresh session
    const challenge = await db.prisma.challenge.findUniqueOrThrow({ where: { slug: "flatten" } });
    await db.prisma.userChallengeProgress.update({
      where: { userId_challengeId: { userId: TEST_USER, challengeId: challenge.id } },
      data: { nextReviewAt: new Date(Date.now() - 3600_000) },
    });
    await db.prisma.warmupSession.deleteMany({ where: { userId: TEST_USER } });

    const first = await request(app).get("/api/v1/warmup");
    expect(first.body.reps[0].challenge.slug).toBe("flatten");
    expect(first.body.reps[0].kind).toBe("review");

    await submitPass("flatten"); // completing the review moves nextReviewAt out
    const second = await request(app).get("/api/v1/warmup");
    expect(second.body.reps.map((r: { challenge: { slug: string } }) => r.challenge.slug)).toEqual(
      first.body.reps.map((r: { challenge: { slug: string } }) => r.challenge.slug),
    );
    expect(second.body.reps[0].done).toBe(true);
  });

  it("summary: readiness thresholds + decayed category score + streak shape", async () => {
    const res = await request(app).get("/api/v1/me/summary");
    expect(res.status).toBe(200);
    const js = res.body.categories.find((c: { category: string }) => c.category === "javascript");
    expect(js.passedCount).toBeGreaterThanOrEqual(1);
    expect(js.readiness).toBe("not-practiced"); // <5 passed
    expect(js.score).toBeNull(); // hidden until 5 passed
    expect(js.trend.length).toBeGreaterThanOrEqual(1); // today's reps show up
    expect(res.body.streak.current).toBeGreaterThanOrEqual(1);
    expect(res.body.streak.qualifiedToday).toBe(true);
    expect(res.body.streak.localHour).toBeGreaterThanOrEqual(0);
    expect(res.body.streak.localHour).toBeLessThanOrEqual(23);
    expect(res.body.totals.totalReps).toBeGreaterThanOrEqual(4);
    expect(res.body.streak.justBroken).toBe(false); // qualified today — nothing broke
    expect(res.body.streak.brokenLength).toBeNull();
  });

  it("summary: a real gap surfaces justBroken before the next submission resets it", async () => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const [y, m, d] = today.split("-").map(Number);
    const threeDaysAgo = new Date(Date.UTC(y!, m! - 1, d! - 3));
    await db.prisma.streak.update({
      where: { userId: TEST_USER },
      data: { lastActiveDate: threeDaysAgo, current: 5, longest: 6 },
    });

    const res = await request(app).get("/api/v1/me/summary");
    expect(res.status).toBe(200);
    expect(res.body.streak.justBroken).toBe(true);
    expect(res.body.streak.brokenLength).toBe(5);
    expect(res.body.streak.current).toBe(5); // still the stale pre-reset value
    expect(res.body.streak.qualifiedToday).toBe(false);
  });

  it("heatmap: today's activity appears in the range scan", async () => {
    const res = await request(app).get("/api/v1/me/heatmap");
    expect(res.status).toBe(200);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const todayRow = res.body.days.find((d: { date: string }) => d.date === today);
    expect(todayRow).toBeTruthy();
    expect(todayRow.submissions).toBeGreaterThanOrEqual(4);
    expect(todayRow.minutesActive).toBeGreaterThanOrEqual(1);
  });
});
