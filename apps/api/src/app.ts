import express from "express";
import cors from "cors";
import { env } from "./env.js";
import { authRouter } from "./routes/auth.js";
import { challengesRouter } from "./routes/challenges.js";
import { attemptsRouter } from "./routes/attempts.js";
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
  app.use("/api/v1/attempts", attemptsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
