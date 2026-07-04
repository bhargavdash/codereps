import type { NextFunction, Request, Response } from "express";

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "not_found", message: `No route ${req.method} ${req.path}` },
  });
}

// Express 5 forwards rejected promises here automatically — no asyncHandler wrappers needed.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  console.error(err);
  res.status(500).json({
    error: { code: "internal", message: "Internal server error" },
  });
}
