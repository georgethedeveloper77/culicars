"use strict";
// ============================================================
// CuliCars — Thread 6: Stripe Webhook
// ============================================================
// POST /webhooks/stripe — Stripe webhook events
// Key event: payment_intent.succeeded
// Signature verified via STRIPE_WEBHOOK_SECRET.
// IMPORTANT: Must use raw body for signature verification.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../config/env");
const paymentProviderService_1 = require("../../services/paymentProviderService");
const router = (0, express_1.Router)();
/**
 * Verify Stripe webhook signature using the raw body.
 * Stripe signs: timestamp + '.' + rawBody
 */
function verifyStripeSignature(rawBody, signatureHeader, secret) {
    try {
        const parts = signatureHeader.split(',');
        const timestampPart = parts.find((p) => p.startsWith('t='));
        const sigPart = parts.find((p) => p.startsWith('v1='));
        if (!timestampPart || !sigPart)
            return false;
        const timestamp = timestampPart.slice(2);
        const signature = sigPart.slice(3);
        // Check timestamp is within 5 minutes
        const timestampAge = Math.abs(Date.now() / 1000 - parseInt(timestamp));
        if (timestampAge > 300)
            return false;
        // Compute expected signature
        const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
        const expected = crypto_1.default
            .createHmac('sha256', secret)
            .update(signedPayload)
            .digest('hex');
        return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    }
    catch {
        return false;
    }
}
// Use raw body parser for this route (signature verification needs raw bytes)
router.post('/', (0, express_1.raw)({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            return res.status(400).json({ error: 'Missing stripe-signature header' });
        }
        // req.body is a Buffer when using raw() parser
        const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
        const valid = verifyStripeSignature(rawBody, signature, env_1.env.STRIPE_WEBHOOK_SECRET);
        if (!valid) {
            console.warn('[Stripe Webhook] Invalid signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }
        const event = JSON.parse(rawBody.toString('utf8'));
        console.info(`[Stripe Webhook] Event: ${event.type} ID: ${event.id}`);
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const intent = event.data.object;
                const intentId = intent.id; // This is our providerRef
                await (0, paymentProviderService_1.confirmPayment)(intentId, {
                    stripeEventId: event.id,
                    intentId,
                    amount: intent.amount,
                    currency: intent.currency,
                    metadata: intent.metadata,
                });
                console.info(`[Stripe Webhook] Payment confirmed. Intent=${intentId}`);
                break;
            }
            case 'payment_intent.payment_failed': {
                const intent = event.data.object;
                await (0, paymentProviderService_1.failPayment)(intent.id, `Stripe payment_intent.payment_failed`);
                console.info(`[Stripe Webhook] Payment failed. Intent=${intent.id}`);
                break;
            }
            case 'charge.refunded': {
                const charge = event.data.object;
                const intentId = charge.payment_intent;
                if (intentId) {
                    await (0, paymentProviderService_1.failPayment)(intentId, 'Stripe charge.refunded');
                    console.info(`[Stripe Webhook] Refund processed. Intent=${intentId}`);
                }
                break;
            }
            default:
                console.info(`[Stripe Webhook] Unhandled event: ${event.type}`);
        }
        return res.json({ received: true });
    }
    catch (err) {
        console.error('[Stripe Webhook] Processing error:', err);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
});
exports.default = router;
