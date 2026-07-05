import { Router } from "express";
import { prisma } from "@codereps/db";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

function fallbackUsername(userId: string, email: string | undefined): string {
  const local = email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 18);
  // Suffix with a slice of the (unique) user id so this can never collide —
  // the Postgres trigger (packages/db/supabase/migrations) is the primary
  // creator; this upsert is the idempotent confirm, matching nomad-api's /sync.
  return `${local || "user"}_${userId.replace(/-/g, "").slice(0, 6)}`;
}

/** Idempotent: the auth.users trigger usually creates the row first; this just confirms it. */
authRouter.post("/sync", requireAuth, async (req, res) => {
  const user = req.user!;
  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    create: { id: user.id, username: fallbackUsername(user.id, user.email) },
    update: {},
  });
  res.json({ profile });
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
