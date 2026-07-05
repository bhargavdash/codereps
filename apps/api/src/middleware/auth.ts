import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../env.js";

export interface AuthUser {
  id: string;
  email?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Supabase JWKS endpoint — same verification shape as nomad-api's authMiddleware:
// createRemoteJWKSet + jwtVerify with explicit issuer/audience checks, no
// service-role/secret key needed for token verification at all.
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const config = env();
  if (!config.supabaseUrl) {
    res.status(503).json({
      error: {
        code: "auth_not_configured",
        message: "SUPABASE_URL is not set — see .env.example",
      },
    });
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({
      error: { code: "missing_token", message: "Authorization: Bearer <token> required" },
    });
    return;
  }

  try {
    const token = header.slice("Bearer ".length);
    const { payload } = await jwtVerify(
      token,
      (jwks ??= createRemoteJWKSet(
        new URL(`${config.supabaseUrl}/auth/v1/.well-known/jwks.json`),
      )),
      {
        issuer: `${config.supabaseUrl}/auth/v1`,
        audience: "authenticated",
      },
    );
    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      throw new Error("token has no sub");
    }
    req.user = {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
    };
    next();
  } catch {
    res.status(401).json({
      error: { code: "invalid_token", message: "Invalid or expired token" },
    });
  }
}
