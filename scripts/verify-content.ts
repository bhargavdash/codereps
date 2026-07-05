/**
 * verify-content — board S1-2, the content pipeline's CI gate (architecture §7):
 * every challenge file must Zod-parse AND its own solution must pass its own
 * tests. Content that rots gets caught at PR time, not by a user mid-rep.
 *
 * Node-verifiable runners (js_worker via runner-core, ts_check via the real
 * compiler) run here; react_iframe/css_iframe need a browser and are counted
 * as "browser-verified" (they get covered by the Sprint 4 runner E2E).
 *
 * Run: pnpm verify-content   (or `turbo lint`)
 */

import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import tsPkg from "typescript";
import { z } from "zod";
import { ChallengeFileSchema, type ChallengeFile } from "@codereps/shared";
import {
  runJsWorkerTests,
  runTsCheck,
  type RunResult,
  type TsModule,
} from "@codereps/shared/runner-core";

const ts = tsPkg as unknown as TsModule;

const ROOT = path.resolve(import.meta.dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "challenges");

const red = (s: string): string => `\x1b[31m${s}\x1b[0m`;
const green = (s: string): string => `\x1b[32m${s}\x1b[0m`;
const dim = (s: string): string => `\x1b[2m${s}\x1b[0m`;

interface Failure {
  file: string;
  problems: string[];
}

function transpileIfNeeded(challenge: ChallengeFile): string {
  if (challenge.language === "javascript") return challenge.solutionCode;
  return ts.transpileModule(challenge.solutionCode, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

function describeRunFailures(result: RunResult): string[] {
  return result.cases
    .filter((c) => c.status !== "pass")
    .map((c) => `case "${c.name}" ${c.status}${c.message ? `: ${c.message}` : ""}`);
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

async function main(): Promise<void> {
  const files = await listChallengeFiles();
  if (files.length === 0) {
    console.log(dim(`no challenge files under ${path.relative(ROOT, CONTENT_DIR)}/ yet — nothing to verify`));
    return;
  }

  const failures: Failure[] = [];
  const seenSlugs = new Map<string, string>();
  let verified = 0;
  let browserVerified = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const problems: string[] = [];

    const mod = (await import(pathToFileURL(file).href)) as { default?: unknown };
    if (mod.default === undefined) {
      failures.push({ file: rel, problems: ["file has no default export"] });
      continue;
    }

    const parsed = ChallengeFileSchema.safeParse(mod.default);
    if (!parsed.success) {
      failures.push({ file: rel, problems: [z.prettifyError(parsed.error)] });
      continue;
    }
    const challenge = parsed.data;

    if (path.basename(file, ".ts") !== challenge.slug) {
      problems.push(`filename must match slug "${challenge.slug}"`);
    }
    if (path.basename(path.dirname(file)) !== challenge.category) {
      problems.push(`file must live under content/challenges/${challenge.category}/`);
    }
    const dupe = seenSlugs.get(challenge.slug);
    if (dupe) problems.push(`duplicate slug — already used by ${dupe}`);
    seenSlugs.set(challenge.slug, rel);

    switch (challenge.tests.kind) {
      case "js_worker": {
        const result = await runJsWorkerTests(transpileIfNeeded(challenge), challenge.tests);
        if (result.status !== "passed") {
          problems.push(...describeRunFailures(result));
        }
        break;
      }
      case "ts_check": {
        const result = runTsCheck(ts, challenge.solutionCode, challenge.tests);
        if (result.status !== "passed") {
          problems.push(...describeRunFailures(result));
        }
        break;
      }
      case "react_iframe":
      case "css_iframe":
        browserVerified += 1;
        break;
    }

    if (problems.length > 0) {
      failures.push({ file: rel, problems });
    } else {
      verified += 1;
      console.log(`${green("✓")} ${challenge.slug} ${dim(`(${challenge.category} · ${challenge.runner})`)}`);
    }
  }

  console.log("");
  if (browserVerified > 0) {
    console.log(dim(`${browserVerified} challenge(s) use browser runners — schema-checked here, execution-verified in the app`));
  }
  if (failures.length > 0) {
    console.error(red(`\n${failures.length} of ${files.length} challenge file(s) failed verification:\n`));
    for (const failure of failures) {
      console.error(red(`✗ ${failure.file}`));
      for (const problem of failure.problems) console.error(`    ${problem}`);
    }
    process.exit(1);
  }
  console.log(green(`all ${files.length} challenge file(s) verified (${verified} solution-run, ${browserVerified} browser-deferred)`));
}

await main();
