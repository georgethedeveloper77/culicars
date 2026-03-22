// ============================================================
// CuliCars — Thread 6: Generic Card Provider (Pesapal/Flutterwave)
// ============================================================
// Fallback card payment gateway for Kenya.
// Supports KES. Redirect-based flow.
// Configurable: admin sets the gateway in payment_providers.config
// ============================================================

import { env } from '../../config/env';
import prisma from '../../lib/prisma';
import type { PaymentProviderAdapter, PaymentStatus } from '../../types/payment.types';

/**
 * Get card gateway config from the payment_providers table.
 */
async function getGatewayConfig(): Promise<{
  gateway: string;
  apiKey?: string;
  secretKey?: string;
  merchantId?: string;
  ipnId?: string;
} | null> {
  const provider = await prisma.paymentProvider.findUnique({
    where: { slug: 'card' },
    select: { config: true },
  });

  if (!provider?.config) return null;
  return provider.config as any;
}

export const cardProvider: PaymentProviderAdapter = {
  slug: 'card',

  async initiate(input) {
    const config = await getGatewayConfig();
    if (!config) {
      throw new Error('Card payment gateway not configured. Contact admin.');
    }

    const { gateway } = config;

    if (gateway === 'pesapal') {
      return initiatePesapal(input, config);
    } else if (gateway === 'flutterwave') {
      return initiateFlutterwave(input, config);
    }

    throw new Error(`Unknown card gateway: ${gateway}`);
  },
};

// ---- Pesapal ----

async function initiatePesapal(
  input: Parameters<PaymentProviderAdapter['initiate']>[0],
  config: any
) {
  const { paymentId, amount, currency, credits } = input;

  const tokenRes = await fetch(
    'https://pay.pesapal.com/v3/api/Auth/RequestToken',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumer_key: config.apiKey,
        consumer_secret: config.secretKey,
      }),
    }
  );

  if (!tokenRes.ok) {
    throw new Error('Pesapal authentication failed');
  }

  const { token } = (await tokenRes.json()) as { token: string };

  const orderRes = await fetch(
    'https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest',
    {
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
        callback_url: `${env.WEB_URL}/payment/callback`,
        notification_id: config.ipnId,
        billing_address: {
          phone_number: '',
          email_address: '',
        },
      }),
    }
  );

  if (!orderRes.ok) {
    const body = await orderRes.text();
    throw new Error(`Pesapal order failed: ${body}`);
  }

  const order = (await orderRes.json()) as {
    order_tracking_id: string;
    redirect_url: string;
  };

  return {
    providerRef: order.order_tracking_id,
    providerData: {
      redirectUrl: order.redirect_url,
      gateway: 'pesapal',
    },
  };
}

// ---- Flutterwave ----

async function initiateFlutterwave(
  input: Parameters<PaymentProviderAdapter['initiate']>[0],
  config: any
) {
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
      redirect_url: `${env.WEB_URL}/payment/callback`,
      meta: {
        payment_id: paymentId,
        user_id: userId,
        credits,
      },
      customer: { email: 'customer@culicars.com' },
      customizations: {
        title: 'CuliCars Credits',
        description: `${credits} credit(s)`,
        logo: `${env.WEB_URL}/logo.png`,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Flutterwave payment failed: ${body}`);
  }

  const data = (await res.json()) as {
    status: string;
    data: { link: string };
  };

  return {
    providerRef: paymentId,
    providerData: {
      redirectUrl: data.data.link,
      gateway: 'flutterwave',
    },
  };
}
