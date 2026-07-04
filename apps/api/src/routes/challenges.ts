import { Router } from "express";
import { prisma } from "@codereps/db";
import { CATEGORIES, MODES, type Category, type Mode } from "@codereps/shared";
import { requireAuth } from "../middleware/auth.js";

export const challengesRouter = Router();

challengesRouter.use(requireAuth);

const LIST_SELECT = {
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

challengesRouter.get("/", async (req, res) => {
  const { category, mode, difficulty, tag, cursor } = req.query;

  if (category !== undefined && !CATEGORIES.includes(category as Category)) {
    res.status(400).json({
      error: { code: "bad_category", message: `category must be one of: ${CATEGORIES.join(", ")}` },
    });
    return;
  }
  if (mode !== undefined && !MODES.includes(mode as Mode)) {
    res.status(400).json({
      error: { code: "bad_mode", message: `mode must be one of: ${MODES.join(", ")}` },
    });
    return;
  }
  const difficultyNum = difficulty === undefined ? undefined : Number(difficulty);
  if (difficultyNum !== undefined && !(difficultyNum >= 1 && difficultyNum <= 5)) {
    res.status(400).json({
      error: { code: "bad_difficulty", message: "difficulty must be 1–5" },
    });
    return;
  }

  const take = Math.min(Number(req.query.limit) || 50, 100);
  const rows = await prisma.challenge.findMany({
    where: {
      isPublished: true,
      ...(category !== undefined && { category: category as Category }),
      ...(mode !== undefined && { mode: mode as Mode }),
      ...(difficultyNum !== undefined && { difficulty: difficultyNum }),
      ...(typeof tag === "string" && { tags: { has: tag } }),
    },
    select: LIST_SELECT,
    orderBy: [{ category: "asc" }, { difficulty: "asc" }, { slug: "asc" }],
    take: take + 1,
    ...(typeof cursor === "string" && { cursor: { id: cursor }, skip: 1 }),
  });

  const nextCursor = rows.length > take ? rows[take]!.id : null;
  res.json({ challenges: rows.slice(0, take), nextCursor });
});

challengesRouter.get("/:slug", async (req, res) => {
  const challenge = await prisma.challenge.findUnique({
    where: { slug: req.params.slug },
  });
  if (!challenge || !challenge.isPublished) {
    res.status(404).json({
      error: { code: "not_found", message: "Challenge not found" },
    });
    return;
  }

  // SOLUTION GATING (architecture will-bite #2): the solution leaves the server
  // only through the submit/abandon flow — never on challenge fetch.
  const { solutionCode: _solution, solutionNotesMd: _notes, ...safe } = challenge;
  res.json({ challenge: safe });
});
