// apps/api/src/app.ts
// Express app — middleware stack + route mounting
// Middleware order: helmet → cors → json → logger → IP rate limit → routes → 404 → error handler

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from './config/cors';
import { requestLogger } from './middleware/requestLogger';
import { ipRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { optionalAuth } from './middleware/optionalAuth';

// Routes
import healthRouter from './routes/health';
import searchRouter from './routes/search';

const app = express();

// ── Global Middleware ──────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);
app.use(ipRateLimiter);

// ── Routes ────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/search', optionalAuth, searchRouter);   // Thread 3 — public, guests ok

// ── 404 Catch-All ─────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Route not found',
    statusCode: 404,
  });
});

// ── Error Handler (must be last) ──────────────────
app.use(errorHandler);

export default app;
