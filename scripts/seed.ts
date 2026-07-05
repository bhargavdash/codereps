/**
 * seed — board S1-4: upsert content/challenges into Postgres by slug.
 *
 * Idempotent by design: unchanged challenges are skipped, changed ones get
 * version+1 (change detection = field-level compare against the DB row, so
 * re-running never creates dupes or spurious version bumps).
 *
 * Run: pnpm seed
 */

import path from "node:path";
import { config as loadEnv } from "dotenv";
import { deepEqual } from "@codereps/shared/runner-core";
import type { ChallengeFile } from "@codereps/shared";
import type { Prisma } from "@codereps/db";
import { dim, green, loadChallenges, red, ROOT } from "./lib/load-challenges.js";

loadEnv({ path: path.join(ROOT, "packages", "db", ".env") });
// value import AFTER env is loaded — @codereps/db instantiates PrismaClient on
// import (the type-only import above is erased and costs nothing)
const { prisma } = await import("@codereps/db");

/** The columns a content file owns (everything except id/slug/version/timestamps). */
function contentColumns(challenge: ChallengeFile) {
  return {
    title: challenge.title,
    category: challenge.category,
    mode: challenge.mode,
    difficulty: challenge.difficulty,
    runner: challenge.runner,
    language: challenge.language,
    promptMd: challenge.promptMd,
    starterCode: challenge.starterCode,
    solutionCode: challenge.solutionCode,
    solutionNotesMd: challenge.solutionNotesMd ?? null,
    tests: challenge.tests as unknown as Prisma.InputJsonValue,
    parSeconds: challenge.parSeconds,
    timeLimitSeconds: challenge.timeLimitSeconds,
    tags: challenge.tags,
    isPublished: challenge.isPublished,
  };
}

async function main(): Promise<void> {
  const { loaded, failures } = await loadChallenges();
  if (failures.length > 0) {
    console.error(red("refusing to seed — fix these content files first:"));
    for (const failure of failures) {
      console.error(red(`✗ ${failure.rel}`));
      for (const problem of failure.problems) console.error(`    ${problem}`);
    }
    process.exit(1);
  }

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const { challenge } of loaded) {
    const data = contentColumns(challenge);
    const existing = await prisma.challenge.findUnique({ where: { slug: challenge.slug } });

    if (!existing) {
      await prisma.challenge.create({ data: { slug: challenge.slug, ...data } });
      created += 1;
      console.log(`${green("+")} ${challenge.slug} ${dim("created (v1)")}`);
      continue;
    }

    const changed = Object.entries(data).some(
      ([key, value]) => !deepEqual(existing[key as keyof typeof existing], value),
    );
    if (!changed) {
      unchanged += 1;
      console.log(`${dim("=")} ${challenge.slug} ${dim(`unchanged (v${existing.version})`)}`);
      continue;
    }

    const next = await prisma.challenge.update({
      where: { slug: challenge.slug },
      data: { ...data, version: existing.version + 1 },
    });
    updated += 1;
    console.log(`${green("↑")} ${challenge.slug} ${dim(`updated (v${existing.version} → v${next.version})`)}`);
  }

  const published = await prisma.challenge.count({ where: { isPublished: true } });
  console.log(
    `\n${green("seed complete")} — ${created} created, ${updated} updated, ${unchanged} unchanged · ${published} published challenge(s) in DB`,
  );
  await prisma.$disconnect();
}

await main();
