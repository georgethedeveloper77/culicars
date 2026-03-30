import 'dotenv/config';
// apps/api/src/config/env.ts
// Zod-validated environment variables. Server won't start if required vars are missing.
// Thread 6 additions: payment provider vars (all optional — only needed when provider enabled).

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),

  // App
  API_URL: z.string().url().default('http://localhost:3000'),
  WEB_URL: z.string().url().default('http://localhost:3001'),
  ADMIN_URL: z.string().url().default('http://localhost:3002'),

  // Security
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(16),

  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Google Cloud Vision (Thread 4)
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  // ── Thread 6: Payment Providers (all optional) ──────────

  // M-Pesa Daraja
  MPESA_CONSUMER_KEY: z.string().optional(),
  MPESA_CONSUMER_SECRET: z.string().optional(),
  MPESA_SHORTCODE: z.string().optional(),
  MPESA_PASSKEY: z.string().optional(),
  MPESA_CALLBACK_URL: z.string().url().optional().default('https://api.culicars.com/webhooks/mpesa'),
  MPESA_ENV: z.enum(['sandbox', 'production']).optional().default('sandbox'),

  // PayPal (USD only — does NOT accept KSH)
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_MODE: z.enum(['sandbox', 'production']).optional().default('sandbox'),
  PAYPAL_WEBHOOK_ID: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // RevenueCat (Apple IAP + Google Play)
  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),

  // Scraper
  SCRAPER_USER_AGENT: z.string().default('CuliCarsBot/1.0'),
  SCRAPER_CONCURRENCY: z.coerce.number().default(3),
  SCRAPER_DELAY_MS: z.coerce.number().default(1500),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;