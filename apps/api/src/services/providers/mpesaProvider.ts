// ============================================================
// CuliCars — Thread 6: M-Pesa Daraja STK Push Provider
// ============================================================
// PRIMARY payment method. Sends STK push to user's phone.
// User confirms on phone → Daraja calls our webhook.
// Currency: KES only.
// ============================================================

import { env } from '../../config/env';
import type { PaymentProviderAdapter, PaymentStatus } from '../../types/payment.types';

const DARAJA_SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
const DARAJA_PRODUCTION_URL = 'https://api.safaricom.co.ke';

function getBaseUrl(): string {
  return env.MPESA_ENV === 'production' ? DARAJA_PRODUCTION_URL : DARAJA_SANDBOX_URL;
}

/**
 * Get Daraja OAuth token. Cached for 55 minutes (tokens last 1 hour).
 */
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const credentials = Buffer.from(
    `${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const res = await fetch(
    `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: 'GET',
      headers: { Authorization: `Basic ${credentials}` },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`M-Pesa OAuth failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: string };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  };

  return data.access_token;
}

function generatePassword(timestamp: string): string {
  return Buffer.from(
    `${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');
}

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

export const mpesaProvider: PaymentProviderAdapter = {
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
      BusinessShortCode: env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBuyGoods',
      Amount: Math.round(amount),
      PartyA: formatPhone(phone),
      PartyB: env.MPESA_SHORTCODE,
      PhoneNumber: formatPhone(phone),
      CallBackURL: env.MPESA_CALLBACK_URL,
      AccountReference: `CuliCars-${paymentId.slice(0, 8)}`,
      TransactionDesc: `CuliCars ${input.credits} credit(s)`,
    };

    const res = await fetch(
      `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = (await res.json()) as {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResponseCode: string;
      ResponseDescription: string;
      CustomerMessage: string;
    };

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

  async verify(providerRef: string) {
    const token = await getAccessToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, '')
      .slice(0, 14);
    const password = generatePassword(timestamp);

    const res = await fetch(
      `${getBaseUrl()}/mpesa/stkpushquery/v1/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BusinessShortCode: env.MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: providerRef,
        }),
      }
    );

    const data = (await res.json()) as {
      ResultCode: string;
      ResultDesc: string;
    };

    let status: PaymentStatus = 'pending';
    if (data.ResultCode === '0') {
      status = 'success';
    } else if (data.ResultCode !== undefined && data.ResultCode !== '0') {
      status = 'failed';
    }

    return { status, providerMeta: data as unknown as Record<string, unknown> };
  },
};
