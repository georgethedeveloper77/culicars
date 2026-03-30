// ============================================================
// CuliCars — Thread 6: Stripe Payment Intents Provider
// ============================================================
// Card payments via Stripe. Currency: USD.
// Creates a PaymentIntent → client confirms with Stripe.js.
// Webhook confirms success → credits granted.
// ============================================================

import { env } from '../../config/env';
import type { PaymentProviderAdapter, PaymentStatus } from '../../types/payment.types';

const STRIPE_API_URL = 'https://api.stripe.com/v1';

async function stripeRequest(
  endpoint: string,
  method: 'GET' | 'POST',
  body?: Record<string, string>
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
  };

  const options: RequestInit = { method, headers };

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

export const stripeProvider: PaymentProviderAdapter = {
  slug: 'stripe',

  async initiate(input) {
    const { paymentId, amount, currency, credits, user_id: userId } = input;

    const amountInCents = Math.round(amount * 100);

    const intent = (await stripeRequest('/payment_intents', 'POST', {
      amount: amountInCents.toString(),
      currency: currency.toLowerCase(),
      'metadata[payment_id]': paymentId,
      'metadata[user_id]': userId,
      'metadata[credits]': credits.toString(),
      description: `CuliCars ${credits} credit(s)`,
      'automatic_payment_methods[enabled]': 'true',
    })) as {
      id: string;
      client_secret: string;
      status: string;
    };

    return {
      provider_ref: intent.id,
      providerData: {
        intentId: intent.id,
        clientSecret: intent.client_secret,
        status: intent.status,
      },
    };
  },

  async verify(provider_ref: string) {
    const intent = (await stripeRequest(
      `/payment_intents/${provider_ref}`,
      'GET'
    )) as { status: string };

    let status: PaymentStatus = 'pending';
    if (intent.status === 'succeeded') {
      status = 'success';
    } else if (
      intent.status === 'canceled' ||
      intent.status === 'requires_payment_method'
    ) {
      status = 'failed';
    }

    return { status, provider_meta: intent as unknown as Record<string, unknown> };
  },
};
