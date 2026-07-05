import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

loadEnv(); // apps/api/.env — PORT / WEB_ORIGIN / SUPABASE_URL
// DATABASE_URL lives in packages/db/.env only (single source of truth for the
// connection string; src/ and dist/ sit at the same depth so the relative
// path holds for both). Both loads silently no-op in prod, where Railway
// injects real env vars and no .env files exist.
loadEnv({ path: fileURLToPath(new URL("../../../packages/db/.env", import.meta.url)) });

// value imports AFTER env is loaded — @codereps/db instantiates PrismaClient
// on import, and env.ts caches its snapshot on first call
const { prisma } = await import("@codereps/db");
const { createApp } = await import("./app.js");
const { env } = await import("./env.js");

const { port } = env();
const server = createApp().listen(port, () => {
  console.log(`codereps-api listening on :${port}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received — shutting down`);
  server.close(() => void 0);
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
