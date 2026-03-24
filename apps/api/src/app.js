"use strict";
// apps/api/src/app.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cors_2 = require("./config/cors");
const requestLogger_1 = require("./middleware/requestLogger");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const optionalAuth_1 = require("./middleware/optionalAuth");
const auth_1 = require("./middleware/auth");
const requireRole_1 = require("./middleware/requireRole");
// Routes — Threads 1-5
const health_1 = __importDefault(require("./routes/health"));
const search_1 = __importDefault(require("./routes/search"));
const ocr_1 = __importDefault(require("./routes/ocr"));
const ntsa_1 = __importDefault(require("./routes/ntsa"));
const reports_1 = __importDefault(require("./routes/reports"));
// Routes — Thread 6: Credits & Payments
const payments_1 = __importDefault(require("./routes/payments"));
const credits_1 = __importDefault(require("./routes/credits"));
const mpesa_1 = __importDefault(require("./routes/webhooks/mpesa"));
const paypal_1 = __importDefault(require("./routes/webhooks/paypal"));
const stripe_1 = __importDefault(require("./routes/webhooks/stripe"));
const revenuecat_1 = __importDefault(require("./routes/webhooks/revenuecat"));
// Routes — Thread 7: Scraping & Data Ingestion
const scraper_1 = __importDefault(require("./routes/scraper"));
// Routes — Thread 8: Contributions + Stolen Reports
const contributions_1 = __importDefault(require("./routes/contributions"));
const stolen_1 = __importDefault(require("./routes/stolen"));
// Provider registration — Thread 6
const paymentProviderService_1 = require("./services/paymentProviderService");
const mpesaProvider_1 = require("./services/providers/mpesaProvider");
const paypalProvider_1 = require("./services/providers/paypalProvider");
const stripeProvider_1 = require("./services/providers/stripeProvider");
const revenuecatProvider_1 = require("./services/providers/revenuecatProvider");
const cardProvider_1 = require("./services/providers/cardProvider");
// Scheduler — Thread 7
const scheduledScrape_1 = require("./jobs/scheduledScrape");
// ── Register Payment Providers ────────────────────
(0, paymentProviderService_1.registerProvider)(mpesaProvider_1.mpesaProvider);
(0, paymentProviderService_1.registerProvider)(paypalProvider_1.paypalProvider);
(0, paymentProviderService_1.registerProvider)(stripeProvider_1.stripeProvider);
(0, paymentProviderService_1.registerProvider)(revenuecatProvider_1.revenuecatProvider);
(0, paymentProviderService_1.registerProvider)(cardProvider_1.cardProvider);
const app = (0, express_1.default)();
// ── Global Middleware ──────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(cors_2.corsOptions));
// IMPORTANT: Stripe webhook needs raw body for signature verification.
// Mount it BEFORE the global JSON parser so it gets the raw Buffer.
app.use('/webhooks/stripe', stripe_1.default);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(requestLogger_1.requestLogger);
app.use(rateLimiter_1.ipRateLimiter);
// ── Routes ────────────────────────────────────────
app.use('/health', health_1.default);
app.use('/search', optionalAuth_1.optionalAuth, search_1.default); // Thread 3
app.use('/ocr', auth_1.auth, ocr_1.default); // Thread 4
app.use('/ntsa', auth_1.auth, ntsa_1.default); // Thread 4
app.use('/reports', optionalAuth_1.optionalAuth, reports_1.default); // Thread 5
app.use('/payments', optionalAuth_1.optionalAuth, payments_1.default); // Thread 6
app.use('/credits', auth_1.auth, credits_1.default); // Thread 6
app.use('/admin/scraper', (0, requireRole_1.requireRole)('admin'), scraper_1.default); // Thread 7
app.use('/contributions', optionalAuth_1.optionalAuth, contributions_1.default); // Thread 8
app.use('/stolen-reports', optionalAuth_1.optionalAuth, stolen_1.default); // Thread 8
// Webhooks — NO auth middleware (providers authenticate differently)
// Stripe already mounted above (before json parser)
app.use('/webhooks/mpesa', mpesa_1.default);
app.use('/webhooks/paypal', paypal_1.default);
app.use('/webhooks/revenuecat', revenuecat_1.default);
// ── 404 Catch-All ─────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Route not found',
        statusCode: 404,
    });
});
// ── Error Handler (must be last) ──────────────────
app.use(errorHandler_1.errorHandler);
// ── Scheduled Jobs ────────────────────────────────
// Initialised here so they start when the app module is loaded in index.ts.
// node-cron is no-op in test environments (SCRAPER_ENABLED=false).
(0, scheduledScrape_1.initScheduledScrape)();
exports.default = app;
