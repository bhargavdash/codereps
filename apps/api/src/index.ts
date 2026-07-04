import "dotenv/config";
import { prisma } from "@codereps/db";
import { createApp } from "./app.js";
import { env } from "./env.js";

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
