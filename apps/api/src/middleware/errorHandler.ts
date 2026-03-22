// apps/api/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  // Log full error in dev, minimal in prod
  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 Error:', err);
  } else {
    console.error(`[${statusCode}] ${err.message}`);
  }

  res.status(statusCode).json({
    error: err.code ?? 'INTERNAL_ERROR',
    message,
    statusCode,
  });
}
