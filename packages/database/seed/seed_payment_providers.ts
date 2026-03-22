// packages/database/seed/seed_payment_providers.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPaymentProviders() {
  const providers = [
    { name: 'M-Pesa', slug: 'mpesa' as const, isEnabled: true, config: { env: 'sandbox', shortcode: '174379' } },
    { name: 'PayPal', slug: 'paypal' as const, isEnabled: false, config: { mode: 'sandbox' } },
    { name: 'Stripe', slug: 'stripe' as const, isEnabled: false, config: {} },
    { name: 'Google Pay', slug: 'google_pay' as const, isEnabled: false, config: {} },
    { name: 'Apple IAP', slug: 'apple_iap' as const, isEnabled: false, config: {} },
    { name: 'RevenueCat', slug: 'revenuecat' as const, isEnabled: false, config: {} },
    { name: 'Card', slug: 'card' as const, isEnabled: false, config: { gateway: 'pesapal' } },
  ];

  for (const p of providers) {
    await prisma.paymentProvider.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  console.log(`✅ Seeded ${providers.length} payment providers (M-Pesa ON, rest OFF)`);
}
