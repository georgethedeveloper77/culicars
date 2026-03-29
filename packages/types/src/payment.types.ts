// packages/types/src/payment.types.ts

export type PaymentProvider = 'mpesa' | 'stripe' | 'paypal';

export type CreditTransactionType = 'purchase' | 'unlock' | 'refund' | 'admin_grant';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface CreditPack {
  id: string;
  label: string;
  credits: number;
  price_kes: number;
  price_usd: number;
}

export interface CreditBalance {
  balance: number;
}

export interface StkPushRequest {
  phone: string;       // 254XXXXXXXXX
  pack_id: string;
  platform: 'web' | 'app';
}

export interface StkPushResponse {
  checkout_request_id: string;
  message: string;
}

export interface StripeIntentRequest {
  pack_id: string;
  platform: 'web' | 'app';
}

export interface StripeIntentResponse {
  client_secret: string;
  amount_usd_cents: number;
}

export interface UnlockRequest {
  report_id: string;
}

export interface UnlockResponse {
  unlocked: boolean;
  credits_remaining: number;
  report_id: string;
}
