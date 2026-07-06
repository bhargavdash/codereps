/**
 * Attempts API — board S3-1/S3-2/S3-5, architecture §5/§6.
 *
 * Trust boundaries:
 * - The server owns the clock: startedAt is set here, durationMs is
 *   `server now − startedAt`. Client timing is never consulted.
 * - submit/abandon are the ONLY code paths that return solutionCode
 *   (will-bite #2) — enforced by test.
 * - clientResults are client-attested (MVP threat model §6); code is stored
 *   so growth-tier verification can re-run it later.
 */

import { Router } from "express";
import { prisma, Prisma } from "@codereps/db";
import {
  AbandonBodySchema,
  CreateAttemptBodySchema,
  SubmitBodySchema,
  emaFluency,
  fluencyForSubmission,
  type StreakSummary,
  type SubmissionStatus,
  type SubmitResponse,
} from "@codereps/shared";
import { requireAuth } from "../middleware/auth.js";
import { addDays, dateToDay, dayInTimeZone, dayToDate } from "../lib/dates.js";

export const attemptsRouter = Router();
attemptsRouter.use(requireAuth);

/** Grace beyond timeLimitSeconds before the server forces a timeout verdict. */
const TIME_LIMIT_GRACE_SECONDS = 15;
const DOUBLE_CLICK_WINDOW_MS = 5000;

attemptsRouter.post("/", async (req, res) => {
  const body = CreateAttemptBodySchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: { code: "bad_body", message: "challengeId (uuid) required" } });
    return;
  }
  const userId = req.user!.id;

  const challenge = await prisma.challenge.findUnique({
    where: { id: body.data.challengeId },
    select: { id: true, isPublished: true, timeLimitSeconds: true },
  });
  if (!challenge || !challenge.isPublished) {
    res.status(404).json({ error: { code: "not_found", message: "Challenge not found" } });
    return;
  }

  // double-click guard (S3-1): a just-created open attempt is reused, not duplicated
  const open = await prisma.attempt.findFirst({
    where: {
      userId,
      challengeId: challenge.id,
      submission: null,
      startedAt: { gt: new Date(Date.now() - DOUBLE_CLICK_WINDOW_MS) },
    },
    orderBy: { startedAt: "desc" },
  });
  if (open) {
    res.status(409).json({
      error: {
        code: "attempt_open",
        message: "An attempt for this challenge was just started",
        attemptId: open.id,
        startedAt: open.startedAt.toISOString(),
        timeLimitSeconds: challenge.timeLimitSeconds,
      },
    });
    return;
  }

  const attempt = await prisma.attempt.create({
    data: { userId, challengeId: challenge.id },
  });
  res.status(201).json({
    attemptId: attempt.id,
    startedAt: attempt.startedAt.toISOString(),
    timeLimitSeconds: challenge.timeLimitSeconds,
  });
});

interface LoadedAttempt {
  id: string;
  startedAt: Date;
  challenge: {
    id: string;
    parSeconds: number;
    timeLimitSeconds: number;
    solutionCode: string;
    solutionNotesMd: string | null;
  };
  timezone: string;
}

async function loadOpenAttempt(
  attemptId: string,
  userId: string,
): Promise<{ ok: true; attempt: LoadedAttempt } | { ok: false; status: number; code: string; message: string }> {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      submission: { select: { id: true } },
      challenge: {
        select: {
          id: true,
          parSeconds: true,
          timeLimitSeconds: true,
          solutionCode: true,
          solutionNotesMd: true,
        },
      },
      user: { select: { timezone: true } },
    },
  });
  // a foreign attempt id reads as not-found — don't leak other users' attempts
  if (!attempt || attempt.userId !== userId) {
    return { ok: false, status: 404, code: "not_found", message: "Attempt not found" };
  }
  if (attempt.submission) {
    return { ok: false, status: 409, code: "already_submitted", message: "This attempt already has a submission" };
  }
  return {
    ok: true,
    attempt: {
      id: attempt.id,
      startedAt: attempt.startedAt,
      challenge: attempt.challenge,
      timezone: attempt.user.timezone,
    },
  };
}

interface PersistInput {
  userId: string;
  attempt: LoadedAttempt;
  now: Date;
  status: SubmissionStatus;
  code: string;
  testsPassed: number;
  testsTotal: number;
  durationMs: number;
  keystrokes: number;
  pasteAttempts: number;
  traceGz?: string;
}

/**
 * The S3-2 transaction: Submission → UserChallengeProgress (fluency v0 + EMA)
 * → DailyActivity → Streak, atomically. Abandon reuses it with a
 * non-qualifying status.
 */
async function persistSubmission(input: PersistInput): Promise<SubmitResponse> {
  const { userId, attempt, now, status } = input;
  const durationSeconds = input.durationMs / 1000;
  const fluency = fluencyForSubmission({
    status,
    casesPassed: input.testsPassed,
    casesTotal: input.testsTotal,
    parSeconds: attempt.challenge.parSeconds,
    durationSeconds,
  });
  const qualifies = status === "passed" || status === "failed"; // effort counts, abandonment doesn't (§9)
  const today = dayInTimeZone(now, attempt.timezone);

  return prisma.$transaction(async (tx) => {
    const submission = await tx.submission.create({
      data: {
        attemptId: attempt.id,
        userId,
        challengeId: attempt.challenge.id,
        code: input.code,
        status,
        testsPassed: input.testsPassed,
        testsTotal: input.testsTotal,
        durationMs: input.durationMs,
        keystrokes: input.keystrokes,
        pasteAttempts: input.pasteAttempts,
        fluencyScore: fluency,
        ...(input.traceGz && { trace: { format: "gzip-base64-v1", data: input.traceGz } }),
      },
    });

    const prev = await tx.userChallengeProgress.findUnique({
      where: { userId_challengeId: { userId, challengeId: attempt.challenge.id } },
    });
    const prevBest = prev?.bestFluency === null || prev?.bestFluency === undefined ? null : Number(prev.bestFluency);
    const prevEma = prev?.emaFluency === null || prev?.emaFluency === undefined ? null : Number(prev.emaFluency);
    const nextEma = fluency === null ? prevEma : emaFluency(prevEma, fluency);
    const nextBest = fluency === null ? prevBest : prevBest === null ? fluency : Math.max(prevBest, fluency);
    const passed = status === "passed";

    await tx.userChallengeProgress.upsert({
      where: { userId_challengeId: { userId, challengeId: attempt.challenge.id } },
      create: {
        userId,
        challengeId: attempt.challenge.id,
        attemptsCount: 1,
        passesCount: passed ? 1 : 0,
        bestFluency: nextBest,
        emaFluency: nextEma,
        lastAttemptedAt: now,
        firstPassedAt: passed ? now : null,
      },
      update: {
        attemptsCount: { increment: 1 },
        passesCount: passed ? { increment: 1 } : undefined,
        bestFluency: nextBest,
        emaFluency: nextEma,
        lastAttemptedAt: now,
        ...(passed && !prev?.firstPassedAt && { firstPassedAt: now }),
      },
    });

    const minutes = Math.min(120, Math.max(1, Math.round(input.durationMs / 60_000)));
    await tx.dailyActivity.upsert({
      where: { userId_activityDate: { userId, activityDate: dayToDate(today) } },
      create: {
        userId,
        activityDate: dayToDate(today),
        submissions: 1,
        passes: passed ? 1 : 0,
        minutesActive: minutes,
      },
      update: {
        submissions: { increment: 1 },
        ...(passed && { passes: { increment: 1 } }),
        minutesActive: { increment: minutes },
      },
    });

    const streakRow = await tx.streak.findUnique({ where: { userId } });
    const lastDay = streakRow?.lastActiveDate ? dateToDay(streakRow.lastActiveDate) : null;
    let streak: StreakSummary;
    if (!qualifies) {
      streak = {
        current: streakRow?.current ?? 0,
        longest: streakRow?.longest ?? 0,
        qualifiedToday: lastDay === today,
      };
    } else if (lastDay === today) {
      streak = { current: streakRow!.current, longest: streakRow!.longest, qualifiedToday: true };
    } else {
      const current = lastDay === addDays(today, -1) ? (streakRow?.current ?? 0) + 1 : 1;
      const longest = Math.max(current, streakRow?.longest ?? 0);
      await tx.streak.upsert({
        where: { userId },
        create: { userId, current, longest, lastActiveDate: dayToDate(today) },
        update: { current, longest, lastActiveDate: dayToDate(today) },
      });
      streak = { current, longest, qualifiedToday: true };
    }

    return {
      submission: {
        id: submission.id,
        status,
        testsPassed: input.testsPassed,
        testsTotal: input.testsTotal,
        durationMs: input.durationMs,
        keystrokes: input.keystrokes,
        pasteAttempts: input.pasteAttempts,
        createdAt: submission.createdAt.toISOString(),
      },
      fluency: {
        score: fluency,
        ema: nextEma,
        best: nextBest,
        isPersonalBest: fluency !== null && (prevBest === null || fluency > prevBest),
      },
      streak,
      // the one sanctioned exit for the solution (will-bite #2)
      solutionCode: attempt.challenge.solutionCode,
      solutionNotesMd: attempt.challenge.solutionNotesMd,
    };
  });
}

attemptsRouter.post("/:id/submit", async (req, res) => {
  const body = SubmitBodySchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: { code: "bad_body", message: "invalid submit payload" } });
    return;
  }
  const loaded = await loadOpenAttempt(req.params.id!, req.user!.id);
  if (!loaded.ok) {
    res.status(loaded.status).json({ error: { code: loaded.code, message: loaded.message } });
    return;
  }

  const now = new Date();
  const durationMs = Math.max(0, now.getTime() - loaded.attempt.startedAt.getTime());
  // server-side time-limit enforcement: a "passed" that arrives after the
  // limit (+grace) is a timeout, whatever the client claims
  const overLimit =
    durationMs / 1000 > loaded.attempt.challenge.timeLimitSeconds + TIME_LIMIT_GRACE_SECONDS;
  const status: SubmissionStatus = overLimit ? "timeout" : body.data.clientResults.status;

  try {
    const response = await persistSubmission({
      userId: req.user!.id,
      attempt: loaded.attempt,
      now,
      status,
      code: body.data.code,
      testsPassed: body.data.clientResults.casesPassed,
      testsTotal: body.data.clientResults.casesTotal,
      durationMs,
      keystrokes: body.data.metrics.keystrokes,
      pasteAttempts: body.data.metrics.pasteAttempts,
      traceGz: body.data.traceGz,
    });
    res.json(response);
  } catch (err) {
    // unique(attemptId) lost a race with a concurrent submit
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.status(409).json({ error: { code: "already_submitted", message: "This attempt already has a submission" } });
      return;
    }
    throw err;
  }
});

attemptsRouter.post("/:id/abandon", async (req, res) => {
  const body = AbandonBodySchema.safeParse(req.body ?? {});
  if (!body.success) {
    res.status(400).json({ error: { code: "bad_body", message: "invalid abandon payload" } });
    return;
  }
  const loaded = await loadOpenAttempt(req.params.id!, req.user!.id);
  if (!loaded.ok) {
    res.status(loaded.status).json({ error: { code: loaded.code, message: loaded.message } });
    return;
  }

  const now = new Date();
  try {
    const response = await persistSubmission({
      userId: req.user!.id,
      attempt: loaded.attempt,
      now,
      status: "abandoned",
      code: body.data.code,
      testsPassed: 0,
      testsTotal: 0,
      durationMs: Math.max(0, now.getTime() - loaded.attempt.startedAt.getTime()),
      keystrokes: body.data.metrics.keystrokes,
      pasteAttempts: body.data.metrics.pasteAttempts,
    });
    res.json(response);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      res.status(409).json({ error: { code: "already_submitted", message: "This attempt already has a submission" } });
      return;
    }
    throw err;
  }
});
