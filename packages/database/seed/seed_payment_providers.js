"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPaymentProviders = seedPaymentProviders;
// packages/database/seed/seed_payment_providers.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedPaymentProviders() {
    const providers = [
        { name: 'M-Pesa', slug: 'mpesa', isEnabled: true, config: { env: 'sandbox', shortcode: '174379' } },
        { name: 'PayPal', slug: 'paypal', isEnabled: false, config: { mode: 'sandbox' } },
        { name: 'Stripe', slug: 'stripe', isEnabled: false, config: {} },
        { name: 'Google Pay', slug: 'google_pay', isEnabled: false, config: {} },
        { name: 'Apple IAP', slug: 'apple_iap', isEnabled: false, config: {} },
        { name: 'RevenueCat', slug: 'revenuecat', isEnabled: false, config: {} },
        { name: 'Card', slug: 'card', isEnabled: false, config: { gateway: 'pesapal' } },
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
