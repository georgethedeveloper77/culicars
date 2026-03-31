// apps/api/src/app.ts

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { authRouter } from './routes/auth';
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
import watchRouter from './routes/watch';
import ocrRouter from './routes/ocr';
import { ntsaRouter } from './routes/ntsa';
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
import scraperRouter     from './routes/scraper';
import demandQueueRouter from './routes/admin/demandQueue';

// Routes — Thread 8: Contributions + Stolen Reports
import contributionsRouter from './routes/contributions';
import stolenRouter from './routes/stolen';

// Routes — Thread 10: User Vehicles
import userVehiclesRouter from './routes/userVehicles';

// Routes — Thread 11/12: Notifications
import notificationsRouter from './routes/notifications';

// Routes — Thread 12/13: Data Sources
import dataSourcesRouter from './routes/dataSources';

// Routes — Thread 13: Official Verification
import verificationRouter from './routes/verification';

// Routes — Thread 15: Analytics
import analyticsRouter from './routes/analytics';

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
app.set('trust proxy', 1);
app.use(cors(corsOptions));

// IMPORTANT: Stripe webhook needs raw body for signature verification.
// Mount it BEFORE the global JSON parser so it gets the raw Buffer.
app.use('/webhooks/stripe', stripeWebhookRouter);

app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);
app.use(ipRateLimiter);

// ── Routes ────────────────────────────────────────
app.use('/auth',         authRouter);
app.use('/health',       healthRouter);
app.use('/search',       optionalAuth, searchRouter);                     // T3
app.use('/watch',        watchRouter);                                    // T11/T12
app.use('/ocr',          auth, ocrRouter);                                // T4 — auth only, duplicate removed
app.use('/ntsa',         auth, ntsaRouter);                               // T4
app.use('/reports',      optionalAuth, reportsRouter);                    // T8
app.use('/payments',     optionalAuth, paymentsRouter);                   // T9
app.use('/credits',      auth, creditsRouter);                            // T9
app.use('/user/vehicles', auth, userVehiclesRouter);                      // T10
app.use('/notifications', auth, notificationsRouter);                     // T12
app.use('/contributions', optionalAuth, contributionsRouter);             // T14
app.use('/stolen-reports', optionalAuth, stolenRouter);                   // T8
app.use('/verify',       auth, verificationRouter);                       // T13
app.use('/analytics',    analyticsRouter);                                // T15
app.use('/data-sources', auth, dataSourcesRouter);                        // T7b
app.use('/admin/scraper', requireRole('admin'), scraperRouter);           // T7
app.use('/admin/demand-queue', demandQueueRouter);                        // T7
app.use('/admin/config', adminConfigRouter);                              // T5
app.use('/scraper',      scraperRouter);                                  // T7 legacy

// Webhooks — NO auth middleware (providers authenticate differently)
// Stripe already mounted above (before json parser)
app.use('/webhooks/mpesa',      mpesaWebhookRouter);
app.use('/webhooks/paypal',     paypalWebhookRouter);
app.use('/webhooks/revenuecat', revenuecatWebhookRouter);

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
initScheduledScrape();

export default app;
