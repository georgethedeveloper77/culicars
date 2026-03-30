// ============================================================
// CuliCars — Thread 6: PayPal Orders API Provider
// ============================================================
// International payments. PayPal does NOT accept KSH.
// All PayPal transactions are in USD.
// The frontend displays KSH price, converts to USD on selection.
// ============================================================

import { env } from '../../config/env';
import type { PaymentProviderAdapter, PaymentStatus } from '../../types/payment.types';

const PAYPAL_SANDBOX_URL = 'https://api-m.sandbox.paypal.com';
const PAYPAL_PRODUCTION_URL = 'https://api-m.paypal.com';

function getBaseUrl(): string {
  return env.PAYPAL_MODE === 'production' ? PAYPAL_PRODUCTION_URL : PAYPAL_SANDBOX_URL;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const credentials = Buffer.from(
    `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

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

  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  };

  return data.access_token;
}

export const paypalProvider: PaymentProviderAdapter = {
  slug: 'paypal',

  async initiate(input) {
    const { paymentId, amount, currency, credits, returnUrl, cancelUrl } = input;

    // PayPal ONLY accepts USD — enforce it
    if (currency !== 'USD') {
      throw new Error(
        `PayPal does not accept ${currency}. Use USD. ` +
        `The creditPacks config should route PayPal to USD pricing.`
      );
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
        return_url: returnUrl || `${env.WEB_URL}/payment/success`,
        cancel_url: cancelUrl || `${env.WEB_URL}/payment/cancel`,
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

    const order = (await res.json()) as {
      id: string;
      status: string;
      links: Array<{ rel: string; href: string }>;
    };

    const approvalUrl = order.links.find((l) => l.rel === 'approve')?.href;

    return {
      provider_ref: order.id,
      providerData: {
        orderId: order.id,
        approvalUrl,
        status: order.status,
      },
    };
  },

  async verify(provider_ref: string) {
    const token = await getAccessToken();

    const res = await fetch(
      `${getBaseUrl()}/v2/checkout/orders/${providerRef}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) return null;

    const order = (await res.json()) as { status: string };

    let status: PaymentStatus = 'pending';
    if (order.status === 'COMPLETED' || order.status === 'APPROVED') {
      status = 'success';
    } else if (order.status === 'VOIDED') {
      status = 'failed';
    }

    return { status, provider_meta: order as unknown as Record<string, unknown> };
  },
};
