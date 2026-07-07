/**
 * Builds the static assets the browser runners load from /public/runners/:
 * - react-runtime.js — React 19 + ReactDOM client + @testing-library/dom as
 *   window globals for the sandboxed react_iframe (S4-1)
 * - ts-lib/lib.*.d.ts — the TypeScript default libs the ts_check worker
 *   fetches on demand (S4-2); same-origin + HTTP cache instead of a CDN
 *
 * Output is generated (gitignored); runs on predev/prebuild.
 */

import { build } from "esbuild";
import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const outDir = path.join(webRoot, "public", "runners");

await mkdir(path.join(outDir, "ts-lib"), { recursive: true });

// --- react runtime bundle ---------------------------------------------------
const result = await build({
  entryPoints: [path.join(webRoot, "runner-assets", "react-runtime.ts")],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: path.join(outDir, "react-runtime.js"),
  logLevel: "silent",
  metafile: true,
});
const bytes = Object.values(result.metafile.outputs)[0]?.bytes ?? 0;

// --- typescript default libs -------------------------------------------------
const tsLibDir = path.dirname(
  fileURLToPath(import.meta.resolve("typescript/package.json")),
);
const libSrc = path.join(tsLibDir, "lib");
const libFiles = (await readdir(libSrc)).filter(
  (f) => f.startsWith("lib.") && f.endsWith(".d.ts"),
);
await Promise.all(
  libFiles.map((f) => cp(path.join(libSrc, f), path.join(outDir, "ts-lib", f))),
);
// manifest so the worker knows what exists without a directory listing
await writeFile(
  path.join(outDir, "ts-lib", "manifest.json"),
  JSON.stringify({ files: libFiles.sort() }),
);

console.log(
  `runners built: react-runtime.js ${(bytes / 1024).toFixed(0)}KB · ${libFiles.length} ts lib files`,
);
