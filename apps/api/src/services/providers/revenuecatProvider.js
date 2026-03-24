"use strict";
// ============================================================
// CuliCars — Thread 6: RevenueCat Provider (FIXED IMPORTS)
// ============================================================
// Handles both Apple IAP and Google Play Billing.
// RevenueCat sends a single webhook for all store events.
// Product IDs map to our credit packs.
// Currency: USD (store prices).
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.revenuecatProvider = void 0;
exports.resolveProductToPack = resolveProductToPack;
const creditPacks_1 = require("../../config/creditPacks");
/**
 * Map RevenueCat product IDs to our credit pack IDs.
 * These must match what's configured in App Store Connect
 * and Google Play Console.
 */
const PRODUCT_TO_PACK = {
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
function resolveProductToPack(productId) {
    const packId = PRODUCT_TO_PACK[productId];
    if (!packId)
        return null;
    return (0, creditPacks_1.getPackById)(packId);
}
exports.revenuecatProvider = {
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
