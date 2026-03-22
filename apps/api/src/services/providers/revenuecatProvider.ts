// ============================================================
// CuliCars — Thread 6: RevenueCat Provider (FIXED IMPORTS)
// ============================================================
// Handles both Apple IAP and Google Play Billing.
// RevenueCat sends a single webhook for all store events.
// Product IDs map to our credit packs.
// Currency: USD (store prices).
// ============================================================

import { env } from '../../config/env';
import { getPackById, CREDIT_PACKS } from '../../config/creditPacks';
import type { PaymentProviderAdapter, PaymentStatus } from '../../types/payment.types';

/**
 * Map RevenueCat product IDs to our credit pack IDs.
 * These must match what's configured in App Store Connect
 * and Google Play Console.
 */
const PRODUCT_TO_PACK: Record<string, string> = {
  // iOS (App Store)
  'com.culicars.credits.1': 'culicars_credits_1',
  'com.culicars.credits.3': 'culicars_credits_3',
  'com.culicars.credits.5': 'culicars_credits_5',
  'com.culicars.credits.10': 'culicars_credits_10',
  // Android (Google Play) — same IDs, different store
  'culicars_credits_1': 'culicars_credits_1',
  'culicars_credits_3': 'culicars_credits_3',
  'culicars_credits_5': 'culicars_credits_5',
  'culicars_credits_10': 'culicars_credits_10',
};

/**
 * Resolve RevenueCat product_id → our CreditPack.
 */
export function resolveProductToPack(productId: string) {
  const packId = PRODUCT_TO_PACK[productId];
  if (!packId) return null;
  return getPackById(packId);
}

export const revenuecatProvider: PaymentProviderAdapter = {
  slug: 'revenuecat',

  async initiate(input) {
    // RevenueCat purchases are initiated entirely on the client
    // (Flutter RevenueCat SDK handles the store flow).
    // We only process the webhook callback server-side.

    return {
      providerRef: `rc_${input.paymentId}`,
      providerData: {
        note: 'RevenueCat purchases are initiated on the client via the RevenueCat SDK.',
        packId: input.packId,
      },
    };
  },

  // No server-side verify — RevenueCat webhook is the source of truth
};
