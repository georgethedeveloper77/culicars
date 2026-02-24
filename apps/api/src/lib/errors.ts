import type { NextFunction, Request, Response } from "express";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Not found" });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Bad JSON body
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      message: err.message,
      details: err.details ?? undefined
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ message: "Server error" });
}