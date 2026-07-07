/**
 * ts_check worker (S4-2). Lazy-loads the TypeScript compiler (heavy — only
 * users opening a TS challenge pay for it) and grades with the SAME
 * dependency-injected core verify-content uses (S1-2 design paying off):
 * buildTsCheckSource + diagnosticsToRunResult. Default libs are fetched from
 * /runners/ts-lib/ (same origin, HTTP-cached) following /// <reference lib>
 * chains — no CDN, no IndexedDB ceremony.
 */

import type { TsCheckTests } from "@codereps/shared";
import {
  buildTsCheckSource,
  diagnosticsToRunResult,
  TS_CHECK_FILE_NAME,
  tsCheckCompilerOptions,
  type RunResult,
  type TsModule,
} from "@codereps/shared/runner-core";
import type * as TS from "typescript";

interface TsRunRequest {
  runId: number;
  userCode: string;
  tests: TsCheckTests;
  libBaseUrl: string;
}

let tsPromise: Promise<TsModule> | null = null;
const libCache = new Map<string, string>(); // "lib.es2022.d.ts" → source

const ROOT_LIB = "lib.es2022.d.ts";

async function fetchLib(baseUrl: string, name: string): Promise<void> {
  if (libCache.has(name)) return;
  const res = await fetch(`${baseUrl}/${name}`);
  if (!res.ok) throw new Error(`failed to fetch ${name} (${res.status})`);
  const text = await res.text();
  libCache.set(name, text);
  // follow the reference chain: /// <reference lib="es2021" />
  const refs = [...text.matchAll(/\/\/\/\s*<reference\s+lib="([^"]+)"/g)].map((m) => `lib.${m[1]}.d.ts`);
  await Promise.all(refs.map((ref) => fetchLib(baseUrl, ref)));
}

function check(ts: TsModule, userCode: string, tests: TsCheckTests): RunResult {
  const built = buildTsCheckSource(userCode, tests);
  const options: TS.CompilerOptions = { ...tsCheckCompilerOptions(ts), lib: [ROOT_LIB] };

  const sourceFiles = new Map<string, TS.SourceFile>();
  const getText = (fileName: string): string | undefined =>
    fileName === TS_CHECK_FILE_NAME ? built.source : libCache.get(fileName);

  const host: TS.CompilerHost = {
    getSourceFile: (fileName, languageVersion) => {
      const cached = sourceFiles.get(fileName);
      if (cached) return cached;
      const text = getText(fileName);
      if (text === undefined) return undefined;
      const sf = ts.createSourceFile(fileName, text, languageVersion);
      sourceFiles.set(fileName, sf);
      return sf;
    },
    getDefaultLibFileName: () => ROOT_LIB,
    getDefaultLibLocation: () => "",
    writeFile: () => void 0,
    getCurrentDirectory: () => "",
    getCanonicalFileName: (f) => f,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
    fileExists: (f) => getText(f) !== undefined,
    readFile: (f) => getText(f),
  };

  const program = ts.createProgram([TS_CHECK_FILE_NAME], options, host);
  const diagnostics = [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
  ];
  return diagnosticsToRunResult(ts, built, tests, diagnostics);
}

self.onmessage = async (event: MessageEvent<TsRunRequest>) => {
  const { runId, userCode, tests, libBaseUrl } = event.data;
  try {
    tsPromise ??= import("typescript").then((m) => (m.default ?? m) as unknown as TsModule);
    const [ts] = await Promise.all([tsPromise, fetchLib(libBaseUrl, ROOT_LIB)]);
    postMessage({ runId, result: check(ts, userCode, tests) });
  } catch (err) {
    postMessage({
      runId,
      result: {
        status: "error",
        casesPassed: 0,
        casesTotal: tests.cases.length,
        cases: [],
        setupError: `type checker failed to load: ${(err as Error)?.message ?? String(err)}`,
      } satisfies RunResult,
    });
  }
};
