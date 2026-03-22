// ============================================================
// CuliCars — Thread 6: Payment & Credit Types
// ============================================================

// ---- Ledger ----

export type LedgerType =
  | 'purchase'
  | 'spend'
  | 'bonus'
  | 'refund'
  | 'admin_grant'
  | 'admin_deduct';

export interface LedgerEntry {
  userId: string;
  type: LedgerType;
  creditsDelta: number;     // positive = gain, negative = spend
  source: string;
  reportId?: string;
  txRef?: string;
  metadata?: Record<string, unknown>;
}

// ---- Wallet ----

export interface WalletBalance {
  userId: string;
  balance: number;
  updatedAt: Date | null;
}

// ---- Payments ----

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export type ProviderSlug =
  | 'mpesa'
  | 'paypal'
  | 'stripe'
  | 'revenuecat'
  | 'card';

export interface InitiatePaymentInput {
  userId: string;
  packId: string;
  provider: ProviderSlug;
  phone?: string;           // M-Pesa — required for STK push
  returnUrl?: string;       // PayPal — approval redirect
  cancelUrl?: string;       // PayPal — cancel redirect
}

export interface InitiatePaymentResult {
  paymentId: string;
  provider: ProviderSlug;
  status: PaymentStatus;
  providerRef?: string;
  /** M-Pesa: CheckoutRequestID | PayPal: approval URL | Stripe: client_secret */
  providerData?: Record<string, unknown>;
}

export interface ConfirmPaymentInput {
  paymentId: string;
  providerRef: string;
  providerMeta?: Record<string, unknown>;
}

// ---- Provider Interface ----

export interface PaymentProviderAdapter {
  readonly slug: ProviderSlug;

  /**
   * Initiate a payment with the provider.
   * Returns provider-specific reference and any data the client needs.
   */
  initiate(input: {
    paymentId: string;
    amount: number;
    currency: string;
    credits: number;
    packId: string;
    userId: string;
    phone?: string;
    returnUrl?: string;
    cancelUrl?: string;
  }): Promise<{
    providerRef: string;
    providerData?: Record<string, unknown>;
  }>;

  /**
   * Verify a payment status with the provider (polling fallback).
   * Returns null if the provider doesn't support polling.
   */
  verify?(providerRef: string): Promise<{
    status: PaymentStatus;
    providerMeta?: Record<string, unknown>;
  } | null>;
}

// ---- Webhook Payloads ----

export interface MpesaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value?: string | number;
        }>;
      };
    };
  };
}

export interface PaypalWebhookBody {
  id: string;
  event_type: string;
  resource: {
    id: string;
    status: string;
    purchase_units?: Array<{
      reference_id?: string;
      amount?: { value: string; currency_code: string };
    }>;
    [key: string]: unknown;
  };
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      status: string;
      metadata?: Record<string, string>;
      amount?: number;
      currency?: string;
      [key: string]: unknown;
    };
  };
}

export interface RevenuecatWebhookBody {
  api_version: string;
  event: {
    type: string;
    id: string;
    app_user_id: string;
    product_id: string;
    price_in_purchased_currency: number;
    currency: string;
    store: string;     // APP_STORE | PLAY_STORE
    transaction_id: string;
    [key: string]: unknown;
  };
}
