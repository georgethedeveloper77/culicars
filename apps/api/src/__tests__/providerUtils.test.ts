// ============================================================
// CuliCars — Thread 6: Provider Utility Tests
// ============================================================

import { describe, it, expect } from 'vitest';

// ---- M-Pesa Phone Formatting ----
// Extracted logic for testability

function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.length === 9 && cleaned.startsWith('7')) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

describe('M-Pesa Phone Formatting', () => {
  it('formats 07xx format', () => {
    expect(formatPhone('0712345678')).toBe('254712345678');
  });

  it('formats +254xx format', () => {
    expect(formatPhone('+254712345678')).toBe('254712345678');
  });

  it('formats 254xx format (already correct)', () => {
    expect(formatPhone('254712345678')).toBe('254712345678');
  });

  it('formats 7xx short format', () => {
    expect(formatPhone('712345678')).toBe('254712345678');
  });

  it('strips spaces', () => {
    expect(formatPhone('0712 345 678')).toBe('254712345678');
  });

  it('strips dashes', () => {
    expect(formatPhone('0712-345-678')).toBe('254712345678');
  });

  it('strips plus sign', () => {
    expect(formatPhone('+254 712 345 678')).toBe('254712345678');
  });
});

// ---- Currency Routing ----
// Verify KES vs USD routing logic

describe('Currency Routing', () => {
  const usdProviders = ['paypal', 'stripe', 'revenuecat'];
  const kesProviders = ['mpesa', 'card'];

  function getCurrency(provider: string): string {
    return usdProviders.includes(provider) ? 'USD' : 'KES';
  }

  it('routes M-Pesa to KES', () => {
    expect(getCurrency('mpesa')).toBe('KES');
  });

  it('routes Card to KES', () => {
    expect(getCurrency('card')).toBe('KES');
  });

  it('routes PayPal to USD (PayPal does NOT accept KSH)', () => {
    expect(getCurrency('paypal')).toBe('USD');
  });

  it('routes Stripe to USD', () => {
    expect(getCurrency('stripe')).toBe('USD');
  });

  it('routes RevenueCat to USD', () => {
    expect(getCurrency('revenuecat')).toBe('USD');
  });
});

// ---- Stripe Signature Verification ----

import crypto from 'crypto';

function verifyStripeSignature(
  rawBody: Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const sigPart = parts.find((p) => p.startsWith('v1='));

    if (!timestampPart || !sigPart) return false;

    const timestamp = timestampPart.slice(2);
    const signature = sigPart.slice(3);

    const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

describe('Stripe Signature Verification', () => {
  const secret = 'whsec_test_secret';

  it('verifies valid signature', () => {
    const body = Buffer.from('{"id":"evt_123"}');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedPayload = `${timestamp}.${body.toString('utf8')}`;
    const sig = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    const header = `t=${timestamp},v1=${sig}`;
    expect(verifyStripeSignature(body, header, secret)).toBe(true);
  });

  it('rejects tampered body', () => {
    const body = Buffer.from('{"id":"evt_123"}');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedPayload = `${timestamp}.${body.toString('utf8')}`;
    const sig = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    const header = `t=${timestamp},v1=${sig}`;
    const tamperedBody = Buffer.from('{"id":"evt_HACKED"}');
    expect(verifyStripeSignature(tamperedBody, header, secret)).toBe(false);
  });

  it('rejects wrong secret', () => {
    const body = Buffer.from('{"id":"evt_123"}');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signedPayload = `${timestamp}.${body.toString('utf8')}`;
    const sig = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    const header = `t=${timestamp},v1=${sig}`;
    expect(verifyStripeSignature(body, header, 'wrong_secret')).toBe(false);
  });

  it('rejects missing signature parts', () => {
    const body = Buffer.from('test');
    expect(verifyStripeSignature(body, 'invalid', secret)).toBe(false);
    expect(verifyStripeSignature(body, 't=123', secret)).toBe(false);
    expect(verifyStripeSignature(body, 'v1=abc', secret)).toBe(false);
  });
});
