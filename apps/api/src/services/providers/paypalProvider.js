"use strict";
// ============================================================
// CuliCars — Thread 6: PayPal Orders API Provider
// ============================================================
// International payments. PayPal does NOT accept KSH.
// All PayPal transactions are in USD.
// The frontend displays KSH price, converts to USD on selection.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.paypalProvider = void 0;
const env_1 = require("../../config/env");
const PAYPAL_SANDBOX_URL = 'https://api-m.sandbox.paypal.com';
const PAYPAL_PRODUCTION_URL = 'https://api-m.paypal.com';
function getBaseUrl() {
    return env_1.env.PAYPAL_MODE === 'production' ? PAYPAL_PRODUCTION_URL : PAYPAL_SANDBOX_URL;
}
let tokenCache = null;
async function getAccessToken() {
    if (tokenCache && Date.now() < tokenCache.expiresAt) {
        return tokenCache.token;
    }
    const credentials = Buffer.from(`${env_1.env.PAYPAL_CLIENT_ID}:${env_1.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
    const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`PayPal OAuth failed: ${res.status} ${body}`);
    }
    const data = (await res.json());
    tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    };
    return data.access_token;
}
exports.paypalProvider = {
    slug: 'paypal',
    async initiate(input) {
        const { paymentId, amount, currency, credits, returnUrl, cancelUrl } = input;
        // PayPal ONLY accepts USD — enforce it
        if (currency !== 'USD') {
            throw new Error(`PayPal does not accept ${currency}. Use USD. ` +
                `The creditPacks config should route PayPal to USD pricing.`);
        }
        const token = await getAccessToken();
        const orderPayload = {
            intent: 'CAPTURE',
            purchase_units: [
                {
                    reference_id: paymentId,
                    description: `CuliCars ${credits} credit(s)`,
                    amount: {
                        currency_code: 'USD',
                        value: amount.toFixed(2),
                    },
                    custom_id: paymentId,
                },
            ],
            application_context: {
                brand_name: 'CuliCars',
                landing_page: 'NO_PREFERENCE',
                user_action: 'PAY_NOW',
                return_url: returnUrl || `${env_1.env.WEB_URL}/payment/success`,
                cancel_url: cancelUrl || `${env_1.env.WEB_URL}/payment/cancel`,
            },
        };
        const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'PayPal-Request-Id': paymentId,
            },
            body: JSON.stringify(orderPayload),
        });
        if (!res.ok) {
            const body = await res.text();
            throw new Error(`PayPal create order failed: ${res.status} ${body}`);
        }
        const order = (await res.json());
        const approvalUrl = order.links.find((l) => l.rel === 'approve')?.href;
        return {
            providerRef: order.id,
            providerData: {
                orderId: order.id,
                approvalUrl,
                status: order.status,
            },
        };
    },
    async verify(providerRef) {
        const token = await getAccessToken();
        const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${providerRef}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok)
            return null;
        const order = (await res.json());
        let status = 'pending';
        if (order.status === 'COMPLETED' || order.status === 'APPROVED') {
            status = 'success';
        }
        else if (order.status === 'VOIDED') {
            status = 'failed';
        }
        return { status, providerMeta: order };
    },
};
