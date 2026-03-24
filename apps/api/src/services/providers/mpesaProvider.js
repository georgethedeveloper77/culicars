"use strict";
// ============================================================
// CuliCars — Thread 6: M-Pesa Daraja STK Push Provider
// ============================================================
// PRIMARY payment method. Sends STK push to user's phone.
// User confirms on phone → Daraja calls our webhook.
// Currency: KES only.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.mpesaProvider = void 0;
const env_1 = require("../../config/env");
const DARAJA_SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
const DARAJA_PRODUCTION_URL = 'https://api.safaricom.co.ke';
function getBaseUrl() {
    return env_1.env.MPESA_ENV === 'production' ? DARAJA_PRODUCTION_URL : DARAJA_SANDBOX_URL;
}
/**
 * Get Daraja OAuth token. Cached for 55 minutes (tokens last 1 hour).
 */
let tokenCache = null;
async function getAccessToken() {
    if (tokenCache && Date.now() < tokenCache.expiresAt) {
        return tokenCache.token;
    }
    const credentials = Buffer.from(`${env_1.env.MPESA_CONSUMER_KEY}:${env_1.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const res = await fetch(`${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: { Authorization: `Basic ${credentials}` },
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`M-Pesa OAuth failed: ${res.status} ${body}`);
    }
    const data = (await res.json());
    tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + 55 * 60 * 1000,
    };
    return data.access_token;
}
function generatePassword(timestamp) {
    return Buffer.from(`${env_1.env.MPESA_SHORTCODE}${env_1.env.MPESA_PASSKEY}${timestamp}`).toString('base64');
}
function formatPhone(phone) {
    let cleaned = phone.replace(/[\s\-\+]/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.slice(1);
    }
    else if (cleaned.startsWith('+254')) {
        cleaned = cleaned.slice(1);
    }
    else if (cleaned.length === 9 && cleaned.startsWith('7')) {
        cleaned = '254' + cleaned;
    }
    return cleaned;
}
exports.mpesaProvider = {
    slug: 'mpesa',
    async initiate(input) {
        const { paymentId, amount, phone } = input;
        if (!phone) {
            throw new Error('Phone number is required for M-Pesa payments');
        }
        const token = await getAccessToken();
        const timestamp = new Date()
            .toISOString()
            .replace(/[-T:.Z]/g, '')
            .slice(0, 14);
        const password = generatePassword(timestamp);
        const payload = {
            BusinessShortCode: env_1.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBuyGoods',
            Amount: Math.round(amount),
            PartyA: formatPhone(phone),
            PartyB: env_1.env.MPESA_SHORTCODE,
            PhoneNumber: formatPhone(phone),
            CallBackURL: env_1.env.MPESA_CALLBACK_URL,
            AccountReference: `CuliCars-${paymentId.slice(0, 8)}`,
            TransactionDesc: `CuliCars ${input.credits} credit(s)`,
        };
        const res = await fetch(`${getBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        const data = (await res.json());
        if (data.ResponseCode !== '0') {
            throw new Error(`M-Pesa STK Push failed: ${data.ResponseDescription}`);
        }
        return {
            providerRef: data.CheckoutRequestID,
            providerData: {
                merchantRequestId: data.MerchantRequestID,
                checkoutRequestId: data.CheckoutRequestID,
                customerMessage: data.CustomerMessage,
            },
        };
    },
    async verify(providerRef) {
        const token = await getAccessToken();
        const timestamp = new Date()
            .toISOString()
            .replace(/[-T:.Z]/g, '')
            .slice(0, 14);
        const password = generatePassword(timestamp);
        const res = await fetch(`${getBaseUrl()}/mpesa/stkpushquery/v1/query`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                BusinessShortCode: env_1.env.MPESA_SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: providerRef,
            }),
        });
        const data = (await res.json());
        let status = 'pending';
        if (data.ResultCode === '0') {
            status = 'success';
        }
        else if (data.ResultCode !== undefined && data.ResultCode !== '0') {
            status = 'failed';
        }
        return { status, providerMeta: data };
    },
};
