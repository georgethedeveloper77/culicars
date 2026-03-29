// apps/api/src/services/providers/mpesa.ts

import axios from 'axios';

const {
  MPESA_CONSUMER_KEY = '',
  MPESA_CONSUMER_SECRET = '',
  MPESA_SHORTCODE = '',
  MPESA_PASSKEY = '',
  MPESA_CALLBACK_URL = '',
  MPESA_ENV = 'sandbox',                // 'sandbox' | 'production'
} = process.env;

const BASE_URL =
  MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const { data } = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  return data.access_token as string;
}

function timestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);
}

function password(ts: string): string {
  return Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${ts}`).toString('base64');
}

export interface StkPushParams {
  phone: string;        // 254XXXXXXXXX
  amountKes: number;
  accountRef: string;   // e.g. pack id
  description: string;
  providerRef: string;  // our internal transaction ID
}

export interface StkPushResult {
  checkoutRequestId: string;
  merchantRequestId: string;
}

/**
 * Initiate M-Pesa STK Push.
 * Returns checkout_request_id which is matched in the callback webhook.
 */
export async function initiateStkPush(params: StkPushParams): Promise<StkPushResult> {
  const token = await getAccessToken();
  const ts = timestamp();
  const pwd = password(ts);

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: pwd,
    Timestamp: ts,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(params.amountKes),
    PartyA: params.phone,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: params.phone,
    CallBackURL: MPESA_CALLBACK_URL,
    AccountReference: params.accountRef,
    TransactionDesc: params.description,
  };

  const { data } = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (data.ResponseCode !== '0') {
    throw new Error(`STK Push failed: ${data.ResponseDescription}`);
  }

  return {
    checkoutRequestId: data.CheckoutRequestID,
    merchantRequestId: data.MerchantRequestID,
  };
}

/**
 * Parse M-Pesa STK callback body.
 * Returns { success, checkoutRequestId, mpesaReceiptNumber }
 */
export function parseStkCallback(body: any): {
  success: boolean;
  checkoutRequestId: string;
  mpesaReceiptNumber?: string;
  amount?: number;
  phone?: string;
} {
  const stk = body?.Body?.stkCallback;
  const resultCode: number = stk?.ResultCode;
  const checkoutRequestId: string = stk?.CheckoutRequestID ?? '';

  if (resultCode !== 0) {
    return { success: false, checkoutRequestId };
  }

  const items: any[] = stk?.CallbackMetadata?.Item ?? [];
  const find = (name: string) => items.find((i: any) => i.Name === name)?.Value;

  return {
    success: true,
    checkoutRequestId,
    mpesaReceiptNumber: find('MpesaReceiptNumber'),
    amount: find('Amount'),
    phone: String(find('PhoneNumber') ?? ''),
  };
}
