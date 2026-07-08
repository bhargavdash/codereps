/**
 * Warmup v2 — board S5-2 (supersedes the v0 hash-only selection):
 *   1. up to 2 due SRS reviews (nextReviewAt ≤ now, oldest first)
 *   2. 1 from the weakest category at the user's level
 *   3. fill with unseen at difficulty ramp min(5, floor(catFluency/25)+1)
 *
 * The day's picks are PERSISTED (WarmupSession) on first request — "same 3
 * all day" holds by construction; completing a due review can't reroll it
 * (the v0 bug class is structurally gone).
 */

import { Router } from "express";
import { prisma } from "@codereps/db";
import { categoryFluency, displayedFluency, type Category } from "@codereps/shared";
import { requireAuth } from "../middleware/auth.js";
import { dayInTimeZone, dayToDate } from "../lib/dates.js";

export const warmupRouter = Router();
warmupRouter.use(requireAuth);

/** FNV-1a — deterministic tie-breaking within a day's candidate pools. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

const WARMUP_SIZE = 3;
const CHALLENGE_META_SELECT = {
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
} as const;

type Kind = "review" | "weak-spot" | "new";

async function computePicks(
  userId: string,
  now: Date,
  daySeed: string,
): Promise<{ challengeIds: string[]; kinds: Kind[] }> {
  const [challenges, progress] = await Promise.all([
    prisma.challenge.findMany({
      where: { isPublished: true },
      select: { id: true, category: true, difficulty: true },
    }),
    prisma.userChallengeProgress.findMany({
      where: { userId },
      include: { challenge: { select: { category: true, difficulty: true } } },
    }),
  ]);

  const byHash = (a: { id: string }, b: { id: string }) =>
    fnv1a(`${daySeed}:${a.id}`) - fnv1a(`${daySeed}:${b.id}`);
  const seen = new Set(progress.map((p) => p.challengeId));
  const picked: { id: string; kind: Kind }[] = [];
  const take = (id: string, kind: Kind) => {
    if (!picked.some((p) => p.id === id)) picked.push({ id, kind });
  };

  // 1) due reviews, oldest first
  const due = progress
    .filter((p) => p.nextReviewAt && p.nextReviewAt <= now)
    .sort((a, b) => a.nextReviewAt!.getTime() - b.nextReviewAt!.getTime());
  for (const review of due.slice(0, 2)) take(review.challengeId, "review");

  // per-category displayed fluency (drives weakness + the difficulty ramp)
  const dayMs = 24 * 3600 * 1000;
  const byCategory = new Map<Category, { displayed: number[]; passed: number }>();
  for (const p of progress) {
    const cat = p.challenge.category as Category;
    const entry = byCategory.get(cat) ?? { displayed: [], passed: 0 };
    if (p.emaFluency !== null && p.passesCount > 0) {
      const since = p.lastPassedAt ? Math.floor((now.getTime() - p.lastPassedAt.getTime()) / dayMs) : 0;
      entry.displayed.push(displayedFluency(Number(p.emaFluency), since));
    }
    if (p.passesCount > 0) entry.passed += 1;
    byCategory.set(cat, entry);
  }
  const catScore = (cat: Category): number | null => {
    const entry = byCategory.get(cat);
    return entry ? categoryFluency(entry.displayed, entry.passed) : null;
  };
  const ramp = (cat: Category): number => {
    const score = catScore(cat);
    return Math.min(5, Math.floor((score ?? 0) / 25) + 1);
  };

  // 2) one from the weakest trained category, at the user's level
  if (picked.length < WARMUP_SIZE && byCategory.size > 0) {
    const weakest = [...byCategory.keys()].sort(
      (a, b) => (catScore(a) ?? 0) - (catScore(b) ?? 0),
    )[0]!;
    const candidates = challenges
      .filter((c) => c.category === weakest && !picked.some((p) => p.id === c.id))
      .filter((c) => c.difficulty <= ramp(weakest))
      .sort(byHash);
    if (candidates[0]) take(candidates[0].id, "weak-spot");
  }

  // 3) fill with unseen at the ramp; relax to any unseen, then anything
  const pools = [
    challenges.filter((c) => !seen.has(c.id) && c.difficulty <= ramp(c.category as Category)),
    challenges.filter((c) => !seen.has(c.id)),
    challenges,
  ];
  for (const pool of pools) {
    for (const candidate of [...pool].sort(byHash)) {
      if (picked.length >= WARMUP_SIZE) break;
      take(candidate.id, seen.has(candidate.id) ? "review" : "new");
    }
  }

  return { challengeIds: picked.map((p) => p.id), kinds: picked.map((p) => p.kind) };
}

warmupRouter.get("/", async (req, res) => {
  const userId = req.user!.id;
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  const timezone = profile?.timezone ?? "UTC";
  const now = new Date();
  const today = dayInTimeZone(now, timezone);

  let session = await prisma.warmupSession.findUnique({
    where: { userId_date: { userId, date: dayToDate(today) } },
  });
  if (!session) {
    const picks = await computePicks(userId, now, `${userId}:${today}`);
    // a concurrent first-request may have raced us — the PK upsert settles it
    session = await prisma.warmupSession.upsert({
      where: { userId_date: { userId, date: dayToDate(today) } },
      create: { userId, date: dayToDate(today), ...picks },
      update: {},
    });
  }

  const [challenges, recentSubmissions] = await Promise.all([
    prisma.challenge.findMany({
      where: { id: { in: session.challengeIds } },
      select: CHALLENGE_META_SELECT,
    }),
    prisma.submission.findMany({
      where: {
        userId,
        status: { not: "abandoned" },
        createdAt: { gte: new Date(now.getTime() - 36 * 3600 * 1000) },
      },
      select: { challengeId: true, createdAt: true },
    }),
  ]);
  const byId = new Map(challenges.map((c) => [c.id, c]));
  const doneToday = new Set(
    recentSubmissions
      .filter((s) => dayInTimeZone(s.createdAt, timezone) === today)
      .map((s) => s.challengeId),
  );

  res.json({
    date: today,
    reps: session.challengeIds.flatMap((id, i) => {
      const challenge = byId.get(id);
      if (!challenge) return []; // challenge unpublished since the session was cut
      return [
        {
          n: i + 1,
          kind: session.kinds[i] ?? "new",
          done: doneToday.has(id),
          challenge,
        },
      ];
    }),
  });
});
