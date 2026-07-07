/**
 * Warmup v0 — board S4-4: today's 3, deterministic per (userId, date) so a
 * refresh never rerolls (architecture §5). v0 selection: prefer unseen
 * challenges, fill from seen; SRS-driven review picks arrive in Sprint 5
 * (warmup v2).
 */

import { Router } from "express";
import { prisma } from "@codereps/db";
import { requireAuth } from "../middleware/auth.js";
import { dayInTimeZone } from "../lib/dates.js";

export const warmupRouter = Router();
warmupRouter.use(requireAuth);

/** FNV-1a — stable tiny hash for deterministic per-day ordering. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

const WARMUP_SIZE = 3;

warmupRouter.get("/", async (req, res) => {
  const userId = req.user!.id;

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  const timezone = profile?.timezone ?? "UTC";
  const now = new Date();
  const today = dayInTimeZone(now, timezone);

  const [challenges, firstSubmissions, recentSubmissions] = await Promise.all([
    prisma.challenge.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        mode: true,
        difficulty: true,
        runner: true,
        language: true,
        parSeconds: true,
        timeLimitSeconds: true,
        tags: true,
        version: true,
      },
    }),
    // "seen" must mean seen BEFORE today, or completing rep 1 would reshuffle
    // the unseen-first partition and reroll the day's picks mid-session
    prisma.submission.groupBy({
      by: ["challengeId"],
      where: { userId },
      _min: { createdAt: true },
    }),
    // "done today" = any non-abandoned submission whose user-tz day is today;
    // fetch a 36h window and filter by timezone in JS (cheap, tz-exact)
    prisma.submission.findMany({
      where: {
        userId,
        status: { not: "abandoned" },
        createdAt: { gte: new Date(now.getTime() - 36 * 3600 * 1000) },
      },
      select: { challengeId: true, createdAt: true, status: true },
    }),
  ]);

  const seen = new Set(
    firstSubmissions
      .filter((g) => g._min.createdAt && dayInTimeZone(g._min.createdAt, timezone) < today)
      .map((g) => g.challengeId),
  );
  const doneToday = new Set(
    recentSubmissions
      .filter((s) => dayInTimeZone(s.createdAt, timezone) === today)
      .map((s) => s.challengeId),
  );

  // deterministic day ordering: hash(user, day, challenge) — same 3 all day
  const daySeed = `${userId}:${today}`;
  const ordered = [...challenges].sort(
    (a, b) => fnv1a(`${daySeed}:${a.id}`) - fnv1a(`${daySeed}:${b.id}`),
  );
  const unseen = ordered.filter((c) => !seen.has(c.id));
  const fill = ordered.filter((c) => seen.has(c.id));
  const picked = [...unseen, ...fill].slice(0, WARMUP_SIZE);

  res.json({
    date: today,
    reps: picked.map((challenge, i) => ({
      n: i + 1,
      kind: seen.has(challenge.id) ? "review" : "new",
      done: doneToday.has(challenge.id),
      challenge,
    })),
  });
});
