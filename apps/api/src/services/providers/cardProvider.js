"use strict";
// ============================================================
// CuliCars — Thread 6: Generic Card Provider (Pesapal/Flutterwave)
// ============================================================
// Fallback card payment gateway for Kenya.
// Supports KES. Redirect-based flow.
// Configurable: admin sets the gateway in payment_providers.config
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardProvider = void 0;
const env_1 = require("../../config/env");
const prisma_1 = __importDefault(require("../../lib/prisma"));
/**
 * Get card gateway config from the payment_providers table.
 */
async function getGatewayConfig() {
    const provider = await prisma_1.default.paymentProvider.findUnique({
        where: { slug: 'card' },
        select: { config: true },
    });
    if (!provider?.config)
        return null;
    return provider.config;
}
exports.cardProvider = {
    slug: 'card',
    async initiate(input) {
        const config = await getGatewayConfig();
        if (!config) {
            throw new Error('Card payment gateway not configured. Contact admin.');
        }
        const { gateway } = config;
        if (gateway === 'pesapal') {
            return initiatePesapal(input, config);
        }
        else if (gateway === 'flutterwave') {
            return initiateFlutterwave(input, config);
        }
        throw new Error(`Unknown card gateway: ${gateway}`);
    },
};
// ---- Pesapal ----
async function initiatePesapal(input, config) {
    const { paymentId, amount, currency, credits } = input;
    const tokenRes = await fetch('https://pay.pesapal.com/v3/api/Auth/RequestToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            consumer_key: config.apiKey,
            consumer_secret: config.secretKey,
        }),
    });
    if (!tokenRes.ok) {
        throw new Error('Pesapal authentication failed');
    }
    const { token } = (await tokenRes.json());
    const orderRes = await fetch('https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: paymentId,
            currency,
            amount,
            description: `CuliCars ${credits} credit(s)`,
            callback_url: `${env_1.env.WEB_URL}/payment/callback`,
            notification_id: config.ipnId,
            billing_address: {
                phone_number: '',
                email_address: '',
            },
        }),
    });
    if (!orderRes.ok) {
        const body = await orderRes.text();
        throw new Error(`Pesapal order failed: ${body}`);
    }
    const order = (await orderRes.json());
    return {
        providerRef: order.order_tracking_id,
        providerData: {
            redirectUrl: order.redirect_url,
            gateway: 'pesapal',
        },
    };
}
// ---- Flutterwave ----
async function initiateFlutterwave(input, config) {
    const { paymentId, amount, currency, credits, userId } = input;
    const res = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${config.secretKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            tx_ref: paymentId,
            amount,
            currency,
            redirect_url: `${env_1.env.WEB_URL}/payment/callback`,
            meta: {
                payment_id: paymentId,
                user_id: userId,
                credits,
            },
            customer: { email: 'customer@culicars.com' },
            customizations: {
                title: 'CuliCars Credits',
                description: `${credits} credit(s)`,
                logo: `${env_1.env.WEB_URL}/logo.png`,
            },
        }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Flutterwave payment failed: ${body}`);
    }
    const data = (await res.json());
    return {
        providerRef: paymentId,
        providerData: {
            redirectUrl: data.data.link,
            gateway: 'flutterwave',
        },
    };
}
