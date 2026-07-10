/**
 * /api/v1/me — the read models behind the shell and dashboard (S5-4/S5-5):
 * summary (streak + per-category readiness with §9 decay applied on read) and
 * the heatmap range scan over DailyActivity.
 */

import { Router } from "express";
import { prisma } from "@codereps/db";
import {
  CATEGORIES,
  categoryFluency,
  displayedFluency,
  readinessFor,
  type Category,
  type CategorySummary,
  type HeatmapResponse,
  type MeSummaryResponse,
} from "@codereps/shared";
import { requireAuth } from "../middleware/auth.js";
import { addDays, dateToDay, dayInTimeZone, dayToDate } from "../lib/dates.js";

export const meRouter = Router();
meRouter.use(requireAuth);

const DAY_MS = 24 * 3600 * 1000;

meRouter.get("/summary", async (req, res) => {
  const userId = req.user!.id;
  const now = new Date();

  const [profile, streakRow, progress, activityAgg, trendSubmissions] = await Promise.all([
    prisma.profile.findUnique({ where: { id: userId }, select: { timezone: true } }),
    prisma.streak.findUnique({ where: { userId } }),
    prisma.userChallengeProgress.findMany({
      where: { userId },
      include: { challenge: { select: { category: true, difficulty: true } } },
    }),
    prisma.dailyActivity.aggregate({
      where: { userId },
      _count: { _all: true },
      _sum: { submissions: true, passes: true },
    }),
    prisma.submission.findMany({
      where: {
        userId,
        fluencyScore: { not: null },
        createdAt: { gte: new Date(now.getTime() - 15 * DAY_MS) },
      },
      select: { createdAt: true, fluencyScore: true, challenge: { select: { category: true } } },
    }),
  ]);

  const timezone = profile?.timezone ?? "UTC";
  const today = dayInTimeZone(now, timezone);
  const localHour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", hour12: false }).format(now),
  );

  // trend: mean fluency per active day per category (oldest → newest)
  const trendBuckets = new Map<string, { sum: number; n: number }>(); // `${cat}:${day}`
  for (const s of trendSubmissions) {
    const key = `${s.challenge.category}:${dayInTimeZone(s.createdAt, timezone)}`;
    const bucket = trendBuckets.get(key) ?? { sum: 0, n: 0 };
    bucket.sum += Number(s.fluencyScore);
    bucket.n += 1;
    trendBuckets.set(key, bucket);
  }

  const categories: CategorySummary[] = CATEGORIES.map((category) => {
    const rows = progress.filter((p) => p.challenge.category === category);
    const displayed: number[] = [];
    let passedCount = 0;
    let passedAtD4Plus = 0;
    let lastTrained: Date | null = null;
    for (const p of rows) {
      if (p.passesCount > 0) {
        passedCount += 1;
        if (p.challenge.difficulty >= 4) passedAtD4Plus += 1;
        if (p.emaFluency !== null) {
          const since = p.lastPassedAt
            ? Math.floor((now.getTime() - p.lastPassedAt.getTime()) / DAY_MS)
            : 0;
          displayed.push(displayedFluency(Number(p.emaFluency), since));
        }
      }
      if (p.lastAttemptedAt && (!lastTrained || p.lastAttemptedAt > lastTrained)) {
        lastTrained = p.lastAttemptedAt;
      }
    }
    const daysSinceLastTrained = lastTrained
      ? Math.floor((now.getTime() - lastTrained.getTime()) / DAY_MS)
      : null;
    const score = categoryFluency(displayed, passedCount);

    const trend: CategorySummary["trend"] = [];
    for (let back = 14; back >= 0; back--) {
      const day = addDays(today, -back);
      const bucket = trendBuckets.get(`${category}:${day}`);
      if (bucket) trend.push({ date: day, score: Math.round((bucket.sum / bucket.n) * 10) / 10 });
    }

    return {
      category: category as Category,
      score,
      readiness: readinessFor({ categoryScore: score, passedCount, passedAtD4Plus, daysSinceLastTrained }),
      passedCount,
      attemptedCount: rows.length,
      passedAtD4Plus,
      daysSinceLastTrained,
      trend,
    };
  });

  const lastActiveDay = streakRow?.lastActiveDate ? dateToDay(streakRow.lastActiveDate) : null;
  const current = streakRow?.current ?? 0;
  const justBroken =
    current > 0 && lastActiveDay !== null && lastActiveDay !== today && lastActiveDay !== addDays(today, -1);
  const response: MeSummaryResponse = {
    streak: {
      current,
      longest: streakRow?.longest ?? 0,
      qualifiedToday: lastActiveDay === today,
      localHour,
      justBroken,
      brokenLength: justBroken ? current : null,
    },
    totals: {
      activeDays: activityAgg._count._all,
      totalReps: activityAgg._sum.submissions ?? 0,
      totalPasses: activityAgg._sum.passes ?? 0,
    },
    categories,
  };
  res.json(response);
});

meRouter.get("/heatmap", async (req, res) => {
  const userId = req.user!.id;
  const profile = await prisma.profile.findUnique({ where: { id: userId }, select: { timezone: true } });
  const today = dayInTimeZone(new Date(), profile?.timezone ?? "UTC");

  const to = typeof req.query.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.to) ? req.query.to : today;
  const from =
    typeof req.query.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.from)
      ? req.query.from
      : addDays(to, -370); // 53 weeks, the classic year grid

  const rows = await prisma.dailyActivity.findMany({
    where: { userId, activityDate: { gte: dayToDate(from), lte: dayToDate(to) } },
    orderBy: { activityDate: "asc" },
  });

  const response: HeatmapResponse = {
    from,
    to,
    days: rows.map((r) => ({
      date: dateToDay(r.activityDate),
      submissions: r.submissions,
      passes: r.passes,
      minutesActive: r.minutesActive,
    })),
  };
  res.json(response);
});
