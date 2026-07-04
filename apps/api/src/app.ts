import express from "express";
import cors from "cors";
import { env } from "./env.js";
import { authRouter } from "./routes/auth.js";
import { challengesRouter } from "./routes/challenges.js";
import { errorHandler, notFound } from "./middleware/error.js";

export function createApp(): express.Express {
  const app = express();

  app.use(cors({ origin: env().webOrigin }));
  app.use(express.json({ limit: "1mb" })); // submissions carry code + gzipped trace

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "codereps-api" });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/challenges", challengesRouter);
  // attempts + submissions routers land in Sprint 3 (board S3-1/S3-2)

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
