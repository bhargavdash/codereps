import { Router } from "express";
import { Prisma, prisma } from "@codereps/db";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

/** Idempotent: creates the Profile row on first sign-in, no-ops afterwards. */
authRouter.post("/sync", requireAuth, async (req, res) => {
  const user = req.user!;
  const existing = await prisma.profile.findUnique({ where: { id: user.id } });
  if (existing) {
    res.json({ profile: existing, created: false });
    return;
  }

  const fallback = `dev_${user.id.replace(/-/g, "").slice(0, 10)}`;
  const preferred =
    user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24) ||
    fallback;

  try {
    const profile = await prisma.profile.create({
      data: { id: user.id, username: preferred },
    });
    res.status(201).json({ profile, created: true });
  } catch (err) {
    // Username taken by someone else → fall back to a per-user unique handle.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const profile = await prisma.profile.create({
        data: { id: user.id, username: fallback },
      });
      res.status(201).json({ profile, created: true });
      return;
    }
    throw err;
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const profile = await prisma.profile.findUnique({ where: { id: req.user!.id } });
  if (!profile) {
    res.status(404).json({
      error: { code: "profile_not_synced", message: "Call POST /api/v1/auth/sync first" },
    });
    return;
  }
  res.json({ profile });
});
