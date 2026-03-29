// apps/api/src/app.ts

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from './config/cors';
import { requestLogger } from './middleware/requestLogger';
import { ipRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { optionalAuth } from './middleware/optionalAuth';
import { auth } from './middleware/auth';
import { requireRole } from './middleware/requireRole';

// Routes — Threads 1-5
import healthRouter from './routes/health';
import searchRouter from './routes/search';
import ocrRouter from './routes/ocr';
import ntsaRouter from './routes/ntsa';
import reportsRouter from './routes/reports';
import adminConfigRouter from './routes/admin-config';

// Routes — Thread 6: Credits & Payments
import paymentsRouter from './routes/payments';
import creditsRouter from './routes/credits';
import mpesaWebhookRouter from './routes/webhooks/mpesa';
import paypalWebhookRouter from './routes/webhooks/paypal';
import stripeWebhookRouter from './routes/webhooks/stripe';
import revenuecatWebhookRouter from './routes/webhooks/revenuecat';

// Routes — Thread 7: Scraping & Data Ingestion
import scraperRouter from './routes/scraper';

// Routes — Thread 8: Contributions + Stolen Reports
import contributionsRouter from './routes/contributions';
import stolenRouter from './routes/stolen';

// Provider registration — Thread 6
import { registerProvider } from './services/paymentProviderService';
import { mpesaProvider } from './services/providers/mpesaProvider';
import { paypalProvider } from './services/providers/paypalProvider';
import { stripeProvider } from './services/providers/stripeProvider';
import { revenuecatProvider } from './services/providers/revenuecatProvider';
import { cardProvider } from './services/providers/cardProvider';

// Scheduler — Thread 7
import { initScheduledScrape } from './jobs/scheduledScrape';

// ── Register Payment Providers ────────────────────
registerProvider(mpesaProvider);
registerProvider(paypalProvider);
registerProvider(stripeProvider);
registerProvider(revenuecatProvider);
registerProvider(cardProvider);

const app: Express = express();

// ── Global Middleware ──────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));

// IMPORTANT: Stripe webhook needs raw body for signature verification.
// Mount it BEFORE the global JSON parser so it gets the raw Buffer.
app.use('/webhooks/stripe', stripeWebhookRouter);

app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);
app.use(ipRateLimiter);

// ── Routes ────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/search', optionalAuth, searchRouter);                    // Thread 3
app.use('/ocr', auth, ocrRouter);                                  // Thread 4
app.use('/ocr', ocrRouter);                                        // Thread 4
app.use('/ntsa', auth, ntsaRouter);                                // Thread 4
app.use('/reports', optionalAuth, reportsRouter);                  // Thread 5
app.use('/payments', optionalAuth, paymentsRouter);                // Thread 6
app.use('/credits', auth, creditsRouter);                          // Thread 6
app.use('/admin/scraper', requireRole('admin'), scraperRouter);    // Thread 7
app.use('/contributions', optionalAuth, contributionsRouter);      // Thread 8
app.use('/stolen-reports', optionalAuth, stolenRouter);            // Thread 8

// Webhooks — NO auth middleware (providers authenticate differently)
// Stripe already mounted above (before json parser)
app.use('/webhooks/mpesa', mpesaWebhookRouter);
app.use('/webhooks/paypal', paypalWebhookRouter);
app.use('/webhooks/revenuecat', revenuecatWebhookRouter);
app.use('/admin/config', adminConfigRouter);

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

// ── Scheduled Jobs ────────────────────────────────
// Initialised here so they start when the app module is loaded in index.ts.
// node-cron is no-op in test environments (SCRAPER_ENABLED=false).
initScheduledScrape();

export default app;
