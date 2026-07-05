/**
 * ts_check grading — the type-challenges pattern (architecture §6): append
 * per-case Expect<Equal<…>> assertions to the user's code, grade = zero
 * diagnostics.
 *
 * The `typescript` module is dependency-injected (`tsm`), never imported at
 * runtime: verify-content passes the repo's copy, the Sprint 4 browser worker
 * passes its lazy-loaded copy and reuses buildTsCheckSource +
 * diagnosticsToRunResult with an @typescript/vfs program.
 */

import type * as TS from "typescript";
import type { TsCheckTests } from "../challenge-schema.js";

/** The injected `typescript` module — import it however your environment needs, then cast. */
export type TsModule = typeof TS;
import { summarizeCases, type CaseResult, type RunResult } from "./types.js";

/** Type-level assertion utilities available to every ts_check challenge. */
export const TS_CHECK_PRELUDE = `type Expect<T extends true> = T;
type ExpectFalse<T extends false> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type NotEqual<X, Y> = Equal<X, Y> extends true ? false : true;
`;

export const TS_CHECK_FILE_NAME = "/__challenge__.ts";

export interface TsCheckSource {
  source: string;
  /** 1-based inclusive line ranges within `source`. */
  userRange: { startLine: number; endLine: number };
  caseRanges: { name: string; startLine: number; endLine: number }[];
}

export function buildTsCheckSource(userCode: string, tests: TsCheckTests): TsCheckSource {
  const lineCount = (text: string): number => text.split("\n").length;

  const preludeLines = lineCount(TS_CHECK_PRELUDE);
  const userStart = preludeLines + 1;
  const userEnd = preludeLines + lineCount(userCode);

  let cursor = userEnd;
  const caseRanges: TsCheckSource["caseRanges"] = [];
  const caseChunks: string[] = [];
  for (const testCase of tests.cases) {
    const chunk = `// case: ${testCase.name}\n${testCase.assertion}`;
    caseChunks.push(chunk);
    caseRanges.push({
      name: testCase.name,
      startLine: cursor + 1,
      endLine: cursor + lineCount(chunk),
    });
    cursor += lineCount(chunk);
  }

  return {
    source: `${TS_CHECK_PRELUDE}${userCode}\n${caseChunks.join("\n")}`,
    userRange: { startLine: userStart, endLine: userEnd },
    caseRanges,
  };
}

export function tsCheckCompilerOptions(tsm: typeof TS): TS.CompilerOptions {
  return {
    strict: true,
    noEmit: true,
    target: tsm.ScriptTarget.ES2022,
    module: tsm.ModuleKind.ESNext,
    lib: ["lib.es2022.d.ts"],
    types: [],
    skipLibCheck: true,
  };
}

export function diagnosticsToRunResult(
  tsm: typeof TS,
  built: TsCheckSource,
  tests: TsCheckTests,
  diagnostics: readonly TS.Diagnostic[],
): RunResult {
  const userIssues: string[] = [];
  const caseIssues = new Map<string, string[]>();

  for (const diagnostic of diagnostics) {
    const text = tsm.flattenDiagnosticMessageText(diagnostic.messageText, " ");
    if (!diagnostic.file || diagnostic.file.fileName !== TS_CHECK_FILE_NAME || diagnostic.start === undefined) {
      userIssues.push(text);
      continue;
    }
    const line = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1;
    const owner = built.caseRanges.find((r) => line >= r.startLine && line <= r.endLine);
    if (owner) {
      const list = caseIssues.get(owner.name) ?? [];
      list.push(text);
      caseIssues.set(owner.name, list);
    } else {
      // User-code (or prelude) region: report with editor-relative line numbers.
      const editorLine = Math.max(1, line - built.userRange.startLine + 1);
      userIssues.push(`line ${editorLine}: ${text}`);
    }
  }

  const cases: CaseResult[] = tests.cases.map((testCase) => {
    if (userIssues.length > 0) {
      return {
        name: testCase.name,
        status: "error",
        ms: 0,
        message: `your code has type errors — ${userIssues[0]}`,
      };
    }
    const issues = caseIssues.get(testCase.name);
    return issues
      ? { name: testCase.name, status: "fail", ms: 0, message: issues.join("; ") }
      : { name: testCase.name, status: "pass", ms: 0 };
  });

  return summarizeCases(cases);
}

/**
 * Node-side convenience used by verify-content: real compiler host with the
 * virtual challenge file overlaid. (Browser runners must NOT call this —
 * createCompilerHost needs ts.sys.)
 */
export function runTsCheck(tsm: typeof TS, userCode: string, tests: TsCheckTests): RunResult {
  const built = buildTsCheckSource(userCode, tests);
  const options = tsCheckCompilerOptions(tsm);

  const host = tsm.createCompilerHost(options, true);
  const base = {
    fileExists: host.fileExists.bind(host),
    readFile: host.readFile.bind(host),
    getSourceFile: host.getSourceFile.bind(host),
  };
  host.fileExists = (f) => f === TS_CHECK_FILE_NAME || base.fileExists(f);
  host.readFile = (f) => (f === TS_CHECK_FILE_NAME ? built.source : base.readFile(f));
  host.getSourceFile = (f, languageVersion, ...rest) =>
    f === TS_CHECK_FILE_NAME
      ? tsm.createSourceFile(TS_CHECK_FILE_NAME, built.source, languageVersion)
      : base.getSourceFile(f, languageVersion, ...rest);

  const program = tsm.createProgram([TS_CHECK_FILE_NAME], options, host);
  const diagnostics = [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ];
  return diagnosticsToRunResult(tsm, built, tests, diagnostics);
}
