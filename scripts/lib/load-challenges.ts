/**
 * Shared content-file loader for verify-content + seed. Discovers every
 * content/challenges/**\/*.ts file, imports it, and Zod-parses the default
 * export. Structural file checks (name↔slug, folder↔category, dupes) live
 * here so both scripts enforce them identically.
 */

import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { ChallengeFileSchema, type ChallengeFile } from "@codereps/shared";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const CONTENT_DIR = path.join(ROOT, "content", "challenges");

export interface LoadedChallenge {
  rel: string;
  challenge: ChallengeFile;
}

export interface LoadFailure {
  rel: string;
  problems: string[];
}

export interface LoadReport {
  loaded: LoadedChallenge[];
  failures: LoadFailure[];
}

async function listChallengeFiles(): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(CONTENT_DIR, { recursive: true, withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".ts"))
    .map((e) => path.join(e.parentPath, e.name))
    .sort();
}

export async function loadChallenges(): Promise<LoadReport> {
  const files = await listChallengeFiles();
  const loaded: LoadedChallenge[] = [];
  const failures: LoadFailure[] = [];
  const seenSlugs = new Map<string, string>();

  for (const file of files) {
    const rel = path.relative(ROOT, file);

    const mod = (await import(pathToFileURL(file).href)) as { default?: unknown };
    if (mod.default === undefined) {
      failures.push({ rel, problems: ["file has no default export"] });
      continue;
    }

    const parsed = ChallengeFileSchema.safeParse(mod.default);
    if (!parsed.success) {
      failures.push({ rel, problems: [z.prettifyError(parsed.error)] });
      continue;
    }
    const challenge = parsed.data;

    const problems: string[] = [];
    if (path.basename(file, ".ts") !== challenge.slug) {
      problems.push(`filename must match slug "${challenge.slug}"`);
    }
    if (path.basename(path.dirname(file)) !== challenge.category) {
      problems.push(`file must live under content/challenges/${challenge.category}/`);
    }
    const dupe = seenSlugs.get(challenge.slug);
    if (dupe) problems.push(`duplicate slug — already used by ${dupe}`);
    seenSlugs.set(challenge.slug, rel);

    if (problems.length > 0) {
      failures.push({ rel, problems });
    } else {
      loaded.push({ rel, challenge });
    }
  }

  return { loaded, failures };
}

export const red = (s: string): string => `\x1b[31m${s}\x1b[0m`;
export const green = (s: string): string => `\x1b[32m${s}\x1b[0m`;
export const dim = (s: string): string => `\x1b[2m${s}\x1b[0m`;
