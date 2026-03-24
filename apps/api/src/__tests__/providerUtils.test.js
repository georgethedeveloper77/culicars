"use strict";
// ============================================================
// CuliCars — Thread 6: Provider Utility Tests
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// ---- M-Pesa Phone Formatting ----
// Extracted logic for testability
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
(0, vitest_1.describe)('M-Pesa Phone Formatting', () => {
    (0, vitest_1.it)('formats 07xx format', () => {
        (0, vitest_1.expect)(formatPhone('0712345678')).toBe('254712345678');
    });
    (0, vitest_1.it)('formats +254xx format', () => {
        (0, vitest_1.expect)(formatPhone('+254712345678')).toBe('254712345678');
    });
    (0, vitest_1.it)('formats 254xx format (already correct)', () => {
        (0, vitest_1.expect)(formatPhone('254712345678')).toBe('254712345678');
    });
    (0, vitest_1.it)('formats 7xx short format', () => {
        (0, vitest_1.expect)(formatPhone('712345678')).toBe('254712345678');
    });
    (0, vitest_1.it)('strips spaces', () => {
        (0, vitest_1.expect)(formatPhone('0712 345 678')).toBe('254712345678');
    });
    (0, vitest_1.it)('strips dashes', () => {
        (0, vitest_1.expect)(formatPhone('0712-345-678')).toBe('254712345678');
    });
    (0, vitest_1.it)('strips plus sign', () => {
        (0, vitest_1.expect)(formatPhone('+254 712 345 678')).toBe('254712345678');
    });
});
// ---- Currency Routing ----
// Verify KES vs USD routing logic
(0, vitest_1.describe)('Currency Routing', () => {
    const usdProviders = ['paypal', 'stripe', 'revenuecat'];
    const kesProviders = ['mpesa', 'card'];
    function getCurrency(provider) {
        return usdProviders.includes(provider) ? 'USD' : 'KES';
    }
    (0, vitest_1.it)('routes M-Pesa to KES', () => {
        (0, vitest_1.expect)(getCurrency('mpesa')).toBe('KES');
    });
    (0, vitest_1.it)('routes Card to KES', () => {
        (0, vitest_1.expect)(getCurrency('card')).toBe('KES');
    });
    (0, vitest_1.it)('routes PayPal to USD (PayPal does NOT accept KSH)', () => {
        (0, vitest_1.expect)(getCurrency('paypal')).toBe('USD');
    });
    (0, vitest_1.it)('routes Stripe to USD', () => {
        (0, vitest_1.expect)(getCurrency('stripe')).toBe('USD');
    });
    (0, vitest_1.it)('routes RevenueCat to USD', () => {
        (0, vitest_1.expect)(getCurrency('revenuecat')).toBe('USD');
    });
});
// ---- Stripe Signature Verification ----
const crypto_1 = __importDefault(require("crypto"));
function verifyStripeSignature(rawBody, signatureHeader, secret) {
    try {
        const parts = signatureHeader.split(',');
        const timestampPart = parts.find((p) => p.startsWith('t='));
        const sigPart = parts.find((p) => p.startsWith('v1='));
        if (!timestampPart || !sigPart)
            return false;
        const timestamp = timestampPart.slice(2);
        const signature = sigPart.slice(3);
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
(0, vitest_1.describe)('Stripe Signature Verification', () => {
    const secret = 'whsec_test_secret';
    (0, vitest_1.it)('verifies valid signature', () => {
        const body = Buffer.from('{"id":"evt_123"}');
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signedPayload = `${timestamp}.${body.toString('utf8')}`;
        const sig = crypto_1.default
            .createHmac('sha256', secret)
            .update(signedPayload)
            .digest('hex');
        const header = `t=${timestamp},v1=${sig}`;
        (0, vitest_1.expect)(verifyStripeSignature(body, header, secret)).toBe(true);
    });
    (0, vitest_1.it)('rejects tampered body', () => {
        const body = Buffer.from('{"id":"evt_123"}');
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signedPayload = `${timestamp}.${body.toString('utf8')}`;
        const sig = crypto_1.default
            .createHmac('sha256', secret)
            .update(signedPayload)
            .digest('hex');
        const header = `t=${timestamp},v1=${sig}`;
        const tamperedBody = Buffer.from('{"id":"evt_HACKED"}');
        (0, vitest_1.expect)(verifyStripeSignature(tamperedBody, header, secret)).toBe(false);
    });
    (0, vitest_1.it)('rejects wrong secret', () => {
        const body = Buffer.from('{"id":"evt_123"}');
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signedPayload = `${timestamp}.${body.toString('utf8')}`;
        const sig = crypto_1.default
            .createHmac('sha256', secret)
            .update(signedPayload)
            .digest('hex');
        const header = `t=${timestamp},v1=${sig}`;
        (0, vitest_1.expect)(verifyStripeSignature(body, header, 'wrong_secret')).toBe(false);
    });
    (0, vitest_1.it)('rejects missing signature parts', () => {
        const body = Buffer.from('test');
        (0, vitest_1.expect)(verifyStripeSignature(body, 'invalid', secret)).toBe(false);
        (0, vitest_1.expect)(verifyStripeSignature(body, 't=123', secret)).toBe(false);
        (0, vitest_1.expect)(verifyStripeSignature(body, 'v1=abc', secret)).toBe(false);
    });
});
