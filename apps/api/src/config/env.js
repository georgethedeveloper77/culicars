"use strict";
// apps/api/src/config/env.ts
// Zod-validated environment variables. Server won't start if required vars are missing.
// Thread 6 additions: payment provider vars (all optional — only needed when provider enabled).
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env from monorepo root
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../../.env') });
const envSchema = zod_1.z.object({
    // Supabase
    SUPABASE_URL: zod_1.z.string().url(),
    SUPABASE_ANON_KEY: zod_1.z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1),
    DATABASE_URL: zod_1.z.string().min(1),
    // App
    API_URL: zod_1.z.string().url().default('http://localhost:3000'),
    WEB_URL: zod_1.z.string().url().default('http://localhost:3001'),
    ADMIN_URL: zod_1.z.string().url().default('http://localhost:3002'),
    // Security
    JWT_SECRET: zod_1.z.string().min(32),
    ENCRYPTION_KEY: zod_1.z.string().min(16),
    // Server
    PORT: zod_1.z.coerce.number().default(3000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    // Google Cloud Vision (Thread 4)
    GOOGLE_CLOUD_PROJECT: zod_1.z.string().optional(),
    GOOGLE_APPLICATION_CREDENTIALS: zod_1.z.string().optional(),
    // ── Thread 6: Payment Providers (all optional) ──────────
    // M-Pesa Daraja
    MPESA_CONSUMER_KEY: zod_1.z.string().optional(),
    MPESA_CONSUMER_SECRET: zod_1.z.string().optional(),
    MPESA_SHORTCODE: zod_1.z.string().optional(),
    MPESA_PASSKEY: zod_1.z.string().optional(),
    MPESA_CALLBACK_URL: zod_1.z.string().url().optional().default('https://api.culicars.com/webhooks/mpesa'),
    MPESA_ENV: zod_1.z.enum(['sandbox', 'production']).optional().default('sandbox'),
    // PayPal (USD only — does NOT accept KSH)
    PAYPAL_CLIENT_ID: zod_1.z.string().optional(),
    PAYPAL_CLIENT_SECRET: zod_1.z.string().optional(),
    PAYPAL_MODE: zod_1.z.enum(['sandbox', 'production']).optional().default('sandbox'),
    PAYPAL_WEBHOOK_ID: zod_1.z.string().optional(),
    // Stripe
    STRIPE_SECRET_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: zod_1.z.string().optional(),
    // RevenueCat (Apple IAP + Google Play)
    REVENUECAT_WEBHOOK_SECRET: zod_1.z.string().optional(),
    // Scraper
    SCRAPER_USER_AGENT: zod_1.z.string().default('CuliCarsBot/1.0'),
    SCRAPER_CONCURRENCY: zod_1.z.coerce.number().default(3),
    SCRAPER_DELAY_MS: zod_1.z.coerce.number().default(1500),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
