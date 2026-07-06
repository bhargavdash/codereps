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

import path from "node:path";
import tsPkg from "typescript";
import { type ChallengeFile } from "@codereps/shared";
import {
  runJsWorkerTests,
  runTsCheck,
  type RunResult,
  type TsModule,
} from "@codereps/shared/runner-core";
import { CONTENT_DIR, dim, green, loadChallenges, red, ROOT, type LoadFailure } from "./lib/load-challenges.js";

const ts = tsPkg as unknown as TsModule;

// --stress N (board S2-6): re-run fake-clock challenges N times to prove the
// timing harness is deterministic — debounce/throttle must never flake.
const stressArg = process.argv.indexOf("--stress");
const STRESS_RUNS = stressArg >= 0 ? Math.max(1, Number(process.argv[stressArg + 1]) || 50) : 1;

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

async function main(): Promise<void> {
  const { loaded, failures: loadFailures } = await loadChallenges();
  if (loaded.length === 0 && loadFailures.length === 0) {
    console.log(dim(`no challenge files under ${path.relative(ROOT, CONTENT_DIR)}/ yet — nothing to verify`));
    return;
  }

  const failures: LoadFailure[] = [...loadFailures];
  let browserVerified = 0;

  for (const { rel, challenge } of loaded) {
    const problems: string[] = [];

    switch (challenge.tests.kind) {
      case "js_worker": {
        const runs = challenge.tests.needsFakeClock ? STRESS_RUNS : 1;
        for (let i = 1; i <= runs; i++) {
          const result = await runJsWorkerTests(transpileIfNeeded(challenge), challenge.tests);
          if (result.status !== "passed") {
            const prefix = runs > 1 ? `run ${i}/${runs}: ` : "";
            problems.push(...describeRunFailures(result).map((p) => prefix + p));
            break;
          }
        }
        break;
      }
      case "ts_check": {
        const result = runTsCheck(ts, challenge.solutionCode, challenge.tests);
        if (result.status !== "passed") problems.push(...describeRunFailures(result));
        break;
      }
      case "react_iframe":
      case "css_iframe":
        browserVerified += 1;
        break;
    }

    if (problems.length > 0) {
      failures.push({ rel, problems });
    } else {
      console.log(`${green("✓")} ${challenge.slug} ${dim(`(${challenge.category} · ${challenge.runner})`)}`);
    }
  }

  console.log("");
  if (browserVerified > 0) {
    console.log(dim(`${browserVerified} challenge(s) use browser runners — schema-checked here, execution-verified in the app`));
  }
  if (failures.length > 0) {
    console.error(red(`\n${failures.length} challenge file(s) failed verification:\n`));
    for (const failure of failures) {
      console.error(red(`✗ ${failure.rel}`));
      for (const problem of failure.problems) console.error(`    ${problem}`);
    }
    process.exit(1);
  }
  console.log(green(`all ${loaded.length} challenge file(s) verified (${loaded.length - browserVerified} solution-run, ${browserVerified} browser-deferred)`));
}

await main();
