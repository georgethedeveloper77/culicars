// apps/api/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

// Global IP rate limit — 100 requests per minute
export const ipRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMITED',
    message: 'Too many requests. Please try again in a minute.',
    statusCode: 429,
  },
});

// Per-user rate limit — 30 requests per minute (attach after auth middleware)
export const userRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? req.ip ?? 'unknown',
  message: {
    error: 'RATE_LIMITED',
    message: 'Too many requests for this account. Please slow down.',
    statusCode: 429,
  },
});
