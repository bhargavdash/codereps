/**
 * compileForRun — board S2-4: strip TS/JSX with Sucrase before code reaches a
 * runner. Compile errors surface as friendly pre-run failures (line-anchored)
 * instead of opaque worker crashes.
 */

import { transform } from "sucrase";
import type { Language } from "@codereps/shared";

export type CompileResult =
  | { ok: true; code: string }
  | { ok: false; message: string; line?: number };

const TRANSFORMS: Record<Exclude<Language, "css">, ("typescript" | "jsx")[]> = {
  // [] still runs Sucrase's parser, so plain-JS syntax errors are caught
  // here with a line number rather than inside the worker
  javascript: [],
  typescript: ["typescript"],
  tsx: ["typescript", "jsx"],
};

export function compileForRun(code: string, language: Language): CompileResult {
  if (language === "css") return { ok: true, code };

  try {
    const { code: compiled } = transform(code, {
      transforms: TRANSFORMS[language],
      // classic runtime keeps the output dependency-free; the react_iframe
      // runner (S4-1) provides React as a UMD global
      jsxRuntime: "classic",
      production: true,
    });
    return { ok: true, code: compiled };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    // Sucrase reports "… (12:5)" — surface the line, drop the noise
    const loc = /\((\d+):(\d+)\)\s*$/.exec(raw);
    const line = loc ? Number(loc[1]) : undefined;
    const message = raw.replace(/\s*\(\d+:\d+\)\s*$/, "");
    return { ok: false, message: line ? `Line ${line}: ${message}` : message, line };
  }
}
