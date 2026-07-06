/**
 * S3-1/S3-2/S3-5 integration tests against the real DB: server-owned timing,
 * the submit transaction (fluency/EMA/activity/streak), solution gating, and
 * the abandon flow. requireAuth is mocked; a dedicated test profile is
 * created and fully cleaned up.
 */
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { vi } from "vitest";
import request from "supertest";
import type { Express } from "express";

loadEnv({ path: fileURLToPath(new URL("../../../../packages/db/.env", import.meta.url)) });

const TEST_USER = "11111111-2222-4333-8444-555555555555";

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req: { user?: { id: string } }, _res: unknown, next: () => void) => {
    req.user = { id: TEST_USER };
    next();
  },
}));

const hasDb = Boolean(process.env.DATABASE_URL);

const passResults = (n: number) => ({
  status: "passed" as const,
  casesPassed: n,
  casesTotal: n,
  cases: Array.from({ length: n }, (_, i) => ({ name: `case ${i + 1}`, status: "pass" as const, ms: 2 })),
});

const failResults = (passed: number, total: number) => ({
  status: "failed" as const,
  casesPassed: passed,
  casesTotal: total,
  cases: Array.from({ length: total }, (_, i) => ({
    name: `case ${i + 1}`,
    status: i < passed ? ("pass" as const) : ("fail" as const),
    ms: 2,
  })),
});

const metrics = { keystrokes: 120, pasteAttempts: 0 };

// remote Supabase + interactive transactions → several seconds per request chain
describe.skipIf(!hasDb)("attempts API (submission loop)", { timeout: 30_000 }, () => {
  let app: Express;
  let db: typeof import("@codereps/db");
  let challengeId: string; // pair-sum-sorted
  let parSeconds: number;
  let timeLimitSeconds: number;

  async function cleanupTestUser(): Promise<void> {
    const { prisma } = db;
    await prisma.submission.deleteMany({ where: { userId: TEST_USER } });
    await prisma.attempt.deleteMany({ where: { userId: TEST_USER } });
    await prisma.userChallengeProgress.deleteMany({ where: { userId: TEST_USER } });
    await prisma.dailyActivity.deleteMany({ where: { userId: TEST_USER } });
    await prisma.streak.deleteMany({ where: { userId: TEST_USER } });
    await prisma.profile.deleteMany({ where: { id: TEST_USER } });
  }

  beforeAll(async () => {
    db = await import("@codereps/db");
    const { createApp } = await import("../app.js");
    app = createApp();

    await cleanupTestUser();
    await db.prisma.profile.create({
      data: { id: TEST_USER, username: `attempts_test_${TEST_USER.slice(0, 6)}`, timezone: "Asia/Kolkata" },
    });
    const challenge = await db.prisma.challenge.findUniqueOrThrow({ where: { slug: "pair-sum-sorted" } });
    challengeId = challenge.id;
    parSeconds = challenge.parSeconds;
    timeLimitSeconds = challenge.timeLimitSeconds;
  });

  afterAll(async () => {
    await cleanupTestUser();
    await db.prisma.$disconnect();
  });

  async function createAttempt(): Promise<{ attemptId: string; startedAt: string }> {
    // direct create bypasses the double-click guard for multi-attempt scenarios
    const attempt = await db.prisma.attempt.create({ data: { userId: TEST_USER, challengeId } });
    return { attemptId: attempt.id, startedAt: attempt.startedAt.toISOString() };
  }

  it("creates an attempt with a server startedAt and guards double-clicks", async () => {
    const first = await request(app).post("/api/v1/attempts").send({ challengeId });
    expect(first.status).toBe(201);
    expect(first.body.attemptId).toBeTruthy();
    expect(new Date(first.body.startedAt).getTime()).toBeGreaterThan(Date.now() - 10_000);
    expect(first.body.timeLimitSeconds).toBe(timeLimitSeconds);

    const second = await request(app).post("/api/v1/attempts").send({ challengeId });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("attempt_open");
    expect(second.body.error.attemptId).toBe(first.body.attemptId);

    // close it out so later tests start clean
    await request(app).post(`/api/v1/attempts/${first.body.attemptId}/submit`).send({
      code: "function pairSum() {}",
      clientResults: failResults(0, 6),
      metrics,
    });
  });

  it("pass path: duration is server-computed; fluency, streak, and solution come back", async () => {
    // backdate the attempt: whatever the client believes, duration = now − startedAt
    const attempt = await db.prisma.attempt.create({ data: { userId: TEST_USER, challengeId } });
    const backdated = new Date(Date.now() - parSeconds * 1000); // exactly par ago
    await db.prisma.attempt.update({ where: { id: attempt.id }, data: { startedAt: backdated } });

    const res = await request(app)
      .post(`/api/v1/attempts/${attempt.id}/submit`)
      .send({ code: "function pairSum(a,b){/*…*/}", clientResults: passResults(6), metrics, traceGz: "H4sIAAAA" });

    expect(res.status).toBe(200);
    expect(res.body.submission.status).toBe("passed");
    expect(res.body.submission.durationMs).toBeGreaterThanOrEqual(parSeconds * 1000 - 500);
    expect(res.body.submission.durationMs).toBeLessThan(parSeconds * 1000 + 15_000);
    // ~at par → fluency ≈ 100 (a hair under if a second slipped past par)
    expect(res.body.fluency.score).toBeGreaterThan(98);
    expect(res.body.fluency.isPersonalBest).toBe(true);
    expect(res.body.streak.current).toBeGreaterThanOrEqual(1);
    expect(res.body.streak.qualifiedToday).toBe(true);
    expect(res.body.solutionCode).toContain("function pairSum");

    const stored = await db.prisma.submission.findUnique({ where: { attemptId: attempt.id } });
    expect(stored?.trace).toMatchObject({ format: "gzip-base64-v1" });
  });

  it("fail path: fluency = 40 × ratio, EMA moves halfway", async () => {
    const before = await db.prisma.userChallengeProgress.findUnique({
      where: { userId_challengeId: { userId: TEST_USER, challengeId } },
    });
    const prevEma = Number(before!.emaFluency);

    const { attemptId } = await createAttempt();
    const res = await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .send({ code: "function pairSum(){}", clientResults: failResults(3, 6), metrics });

    expect(res.status).toBe(200);
    expect(res.body.submission.status).toBe("failed");
    expect(res.body.fluency.score).toBe(20); // 40 × 3/6
    expect(res.body.fluency.ema).toBeCloseTo(0.5 * 20 + 0.5 * prevEma, 1);
    expect(res.body.fluency.isPersonalBest).toBe(false);
    expect(res.body.streak.qualifiedToday).toBe(true);
  });

  it("timeout is enforced server-side: a late 'passed' becomes timeout", async () => {
    const attempt = await db.prisma.attempt.create({ data: { userId: TEST_USER, challengeId } });
    await db.prisma.attempt.update({
      where: { id: attempt.id },
      data: { startedAt: new Date(Date.now() - (timeLimitSeconds + 120) * 1000) },
    });

    const res = await request(app)
      .post(`/api/v1/attempts/${attempt.id}/submit`)
      .send({ code: "function pairSum(){}", clientResults: passResults(6), metrics });

    expect(res.status).toBe(200);
    expect(res.body.submission.status).toBe("timeout");
    expect(res.body.fluency.score).toBe(40); // fail formula on 6/6 claimed cases
  });

  it("streak: yesterday → +1, gap → reset to 1, same day → unchanged", async () => {
    const submitOnce = async () => {
      const { attemptId } = await createAttempt();
      const res = await request(app)
        .post(`/api/v1/attempts/${attemptId}/submit`)
        .send({ code: "x", clientResults: failResults(1, 6), metrics });
      expect(res.status).toBe(200);
      return res.body.streak as { current: number; longest: number };
    };

    const setLastActive = async (daysAgo: number, current: number, longest: number) => {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
      const [y, m, d] = today.split("-").map(Number);
      const day = new Date(Date.UTC(y!, m! - 1, d! - daysAgo));
      await db.prisma.streak.update({
        where: { userId: TEST_USER },
        data: { lastActiveDate: day, current, longest },
      });
    };

    await setLastActive(1, 4, 6); // active yesterday, streak 4
    let streak = await submitOnce();
    expect(streak).toMatchObject({ current: 5, longest: 6 });

    streak = await submitOnce(); // same day again
    expect(streak).toMatchObject({ current: 5, longest: 6 });

    await setLastActive(3, 5, 6); // 3-day gap
    streak = await submitOnce();
    expect(streak).toMatchObject({ current: 1, longest: 6 });
  });

  it("abandon: submission recorded, solution revealed, streak NOT touched", async () => {
    const before = await db.prisma.streak.findUnique({ where: { userId: TEST_USER } });
    // make today non-qualified so an abandon-affected streak would be visible
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    const [y, m, d] = today.split("-").map(Number);
    await db.prisma.streak.update({
      where: { userId: TEST_USER },
      data: { lastActiveDate: new Date(Date.UTC(y!, m! - 1, d! - 2)), current: 3, longest: 6 },
    });

    const { attemptId } = await createAttempt();
    const res = await request(app)
      .post(`/api/v1/attempts/${attemptId}/abandon`)
      .send({ code: "gave up", metrics });

    expect(res.status).toBe(200);
    expect(res.body.submission.status).toBe("abandoned");
    expect(res.body.fluency.score).toBeNull();
    expect(res.body.solutionCode).toContain("function pairSum");
    expect(res.body.streak).toMatchObject({ current: 3, qualifiedToday: false });

    const after = await db.prisma.streak.findUnique({ where: { userId: TEST_USER } });
    expect(after?.current).toBe(3); // untouched
    expect(after?.lastActiveDate?.toISOString()).not.toBe(before?.lastActiveDate?.toISOString());
    // ^ still the 2-days-ago value we set, i.e. abandon didn't update it to today
    const abandoned = await db.prisma.submission.findUnique({ where: { attemptId } });
    expect(abandoned?.status).toBe("abandoned");
  });

  it("a second submit on the same attempt is rejected", async () => {
    const { attemptId } = await createAttempt();
    const first = await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .send({ code: "x", clientResults: failResults(0, 6), metrics });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .send({ code: "y", clientResults: passResults(6), metrics });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("already_submitted");
  });

  it("another user's attempt id reads as not found", async () => {
    // an attempt owned by a different (nonexistent) user id can't exist without
    // a profile row, so fabricate the nearest case: an unknown attempt id
    const res = await request(app)
      .post("/api/v1/attempts/00000000-0000-4000-8000-00000000dead/submit")
      .send({ code: "x", clientResults: failResults(0, 1), metrics });
    expect(res.status).toBe(404);
  });

  it("solutionCode appears in submit/abandon responses and nowhere else pre-submit", async () => {
    // the pre-submit surface is covered by challenges.data.test.ts; here we
    // assert the attempt-creation response also stays clean
    const res = await request(app).post("/api/v1/attempts").send({ challengeId });
    const bodyText = JSON.stringify(res.body);
    expect(bodyText).not.toContain("solutionCode");
    if (res.status === 201) {
      await request(app)
        .post(`/api/v1/attempts/${res.body.attemptId}/submit`)
        .send({ code: "x", clientResults: failResults(0, 6), metrics });
    }
  });
});
