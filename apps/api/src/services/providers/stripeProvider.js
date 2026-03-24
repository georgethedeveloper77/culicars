"use strict";
// ============================================================
// CuliCars — Thread 6: Stripe Payment Intents Provider
// ============================================================
// Card payments via Stripe. Currency: USD.
// Creates a PaymentIntent → client confirms with Stripe.js.
// Webhook confirms success → credits granted.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeProvider = void 0;
const env_1 = require("../../config/env");
const STRIPE_API_URL = 'https://api.stripe.com/v1';
async function stripeRequest(endpoint, method, body) {
    const headers = {
        Authorization: `Bearer ${env_1.env.STRIPE_SECRET_KEY}`,
    };
    const options = { method, headers };
    if (body && method === 'POST') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.body = new URLSearchParams(body).toString();
    }
    const res = await fetch(`${STRIPE_API_URL}${endpoint}`, options);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Stripe API error: ${res.status} ${text}`);
    }
    return res.json();
}
exports.stripeProvider = {
    slug: 'stripe',
    async initiate(input) {
        const { paymentId, amount, currency, credits, userId } = input;
        const amountInCents = Math.round(amount * 100);
        const intent = (await stripeRequest('/payment_intents', 'POST', {
            amount: amountInCents.toString(),
            currency: currency.toLowerCase(),
            'metadata[payment_id]': paymentId,
            'metadata[user_id]': userId,
            'metadata[credits]': credits.toString(),
            description: `CuliCars ${credits} credit(s)`,
            'automatic_payment_methods[enabled]': 'true',
        }));
        return {
            providerRef: intent.id,
            providerData: {
                intentId: intent.id,
                clientSecret: intent.client_secret,
                status: intent.status,
            },
        };
    },
    async verify(providerRef) {
        const intent = (await stripeRequest(`/payment_intents/${providerRef}`, 'GET'));
        let status = 'pending';
        if (intent.status === 'succeeded') {
            status = 'success';
        }
        else if (intent.status === 'canceled' ||
            intent.status === 'requires_payment_method') {
            status = 'failed';
        }
        return { status, providerMeta: intent };
    },
};
