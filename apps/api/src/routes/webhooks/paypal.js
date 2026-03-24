"use strict";
// ============================================================
// CuliCars — Thread 6: PayPal Webhook
// ============================================================
// POST /webhooks/paypal — PayPal webhook events
// Key events: CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED
// PayPal sends USD transactions (KSH not supported).
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const env_1 = require("../../config/env");
const paymentProviderService_1 = require("../../services/paymentProviderService");
const router = (0, express_1.Router)();
/**
 * Verify PayPal webhook signature.
 * In production, verify via PayPal's /v1/notifications/verify-webhook-signature.
 * For sandbox, we skip verification but log a warning.
 */
async function verifyPaypalWebhook(req) {
    if (env_1.env.PAYPAL_MODE !== 'production') {
        console.warn('[PayPal Webhook] Skipping signature verification in sandbox mode');
        return true;
    }
    // Production: verify with PayPal API
    try {
        const PAYPAL_API = 'https://api-m.paypal.com';
        const credentials = Buffer.from(`${env_1.env.PAYPAL_CLIENT_ID}:${env_1.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
        // Get token
        const tokenRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });
        const { access_token } = (await tokenRes.json());
        // Verify signature
        const verifyRes = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                auth_algo: req.headers['paypal-auth-algo'],
                cert_url: req.headers['paypal-cert-url'],
                transmission_id: req.headers['paypal-transmission-id'],
                transmission_sig: req.headers['paypal-transmission-sig'],
                transmission_time: req.headers['paypal-transmission-time'],
                webhook_id: env_1.env.PAYPAL_WEBHOOK_ID,
                webhook_event: req.body,
            }),
        });
        const result = (await verifyRes.json());
        return result.verification_status === 'SUCCESS';
    }
    catch (err) {
        console.error('[PayPal Webhook] Verification failed:', err);
        return false;
    }
}
router.post('/', async (req, res) => {
    try {
        const verified = await verifyPaypalWebhook(req);
        if (!verified) {
            console.warn('[PayPal Webhook] Signature verification failed');
            return res.status(401).json({ error: 'Invalid signature' });
        }
        const body = req.body;
        const { event_type, resource } = body;
        console.info(`[PayPal Webhook] Event: ${event_type} Resource: ${resource.id}`);
        switch (event_type) {
            case 'CHECKOUT.ORDER.APPROVED':
            case 'PAYMENT.CAPTURE.COMPLETED': {
                // The order ID is our providerRef
                const orderId = resource.id;
                // For CAPTURE events, the order ID might be in the supplementary data
                // For ORDER events, resource.id IS the order ID
                const providerRef = event_type === 'PAYMENT.CAPTURE.COMPLETED'
                    ? resource.supplementary_data?.related_ids?.order_id ?? orderId
                    : orderId;
                await (0, paymentProviderService_1.confirmPayment)(providerRef, {
                    eventType: event_type,
                    resourceId: resource.id,
                    status: resource.status,
                });
                console.info(`[PayPal Webhook] Payment confirmed. Order=${providerRef}`);
                break;
            }
            case 'PAYMENT.CAPTURE.DENIED':
            case 'PAYMENT.CAPTURE.REFUNDED': {
                const orderId = resource.id;
                await (0, paymentProviderService_1.failPayment)(orderId, `PayPal ${event_type}`);
                console.info(`[PayPal Webhook] Payment failed/refunded. ID=${orderId}`);
                break;
            }
            default:
                console.info(`[PayPal Webhook] Unhandled event type: ${event_type}`);
        }
        return res.status(200).json({ received: true });
    }
    catch (err) {
        console.error('[PayPal Webhook] Processing error:', err);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
});
exports.default = router;
