// apps/api/src/services/providers/stripe.ts

import Stripe from 'stripe';

const { STRIPE_SECRET_KEY = '', STRIPE_WEBHOOK_SECRET = '' } = process.env;

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    if (!STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
    _stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
  }
  return _stripe;
}

export interface CreateIntentParams {
  amountUsdCents: number;
  currency?: string;
  metadata?: Record<string, string>;
}

export async function createPaymentIntent(params: CreateIntentParams): Promise<{
  clientSecret: string;
  intentId: string;
}> {
  const stripe = getStripe();
  const intent = await stripe.paymentIntents.create({
    amount: params.amountUsdCents,
    currency: params.currency ?? 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: params.metadata ?? {},
  });

  if (!intent.client_secret) throw new Error('Stripe did not return client_secret');

  return { clientSecret: intent.client_secret, intentId: intent.id };
}

/**
 * Verify and parse a Stripe webhook event.
 * Requires raw Buffer body — mount webhook route BEFORE express.json().
 */
export function parseWebhookEvent(
  payload: Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}

export { STRIPE_WEBHOOK_SECRET };
