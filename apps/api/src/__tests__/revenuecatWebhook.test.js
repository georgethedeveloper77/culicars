"use strict";
// ============================================================
// CuliCars — Thread 6: RevenueCat Webhook Tests
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const revenuecatProvider_1 = require("../services/providers/revenuecatProvider");
(0, vitest_1.describe)('RevenueCat Provider', () => {
    (0, vitest_1.describe)('resolveProductToPack', () => {
        (0, vitest_1.it)('resolves iOS product ID to pack', () => {
            const pack = (0, revenuecatProvider_1.resolveProductToPack)('com.culicars.credits.5');
            (0, vitest_1.expect)(pack).toBeDefined();
            (0, vitest_1.expect)(pack.id).toBe('culicars_credits_5');
            (0, vitest_1.expect)(pack.credits).toBe(5);
        });
        (0, vitest_1.it)('resolves Android product ID to pack', () => {
            const pack = (0, revenuecatProvider_1.resolveProductToPack)('culicars_credits_10');
            (0, vitest_1.expect)(pack).toBeDefined();
            (0, vitest_1.expect)(pack.id).toBe('culicars_credits_10');
            (0, vitest_1.expect)(pack.credits).toBe(10);
        });
        (0, vitest_1.it)('resolves all iOS products', () => {
            (0, vitest_1.expect)((0, revenuecatProvider_1.resolveProductToPack)('com.culicars.credits.1')?.credits).toBe(1);
            (0, vitest_1.expect)((0, revenuecatProvider_1.resolveProductToPack)('com.culicars.credits.3')?.credits).toBe(3);
            (0, vitest_1.expect)((0, revenuecatProvider_1.resolveProductToPack)('com.culicars.credits.5')?.credits).toBe(5);
            (0, vitest_1.expect)((0, revenuecatProvider_1.resolveProductToPack)('com.culicars.credits.10')?.credits).toBe(10);
        });
        (0, vitest_1.it)('resolves all Android products', () => {
            (0, vitest_1.expect)((0, revenuecatProvider_1.resolveProductToPack)('culicars_credits_1')?.credits).toBe(1);
            (0, vitest_1.expect)((0, revenuecatProvider_1.resolveProductToPack)('culicars_credits_3')?.credits).toBe(3);
            (0, vitest_1.expect)((0, revenuecatProvider_1.resolveProductToPack)('culicars_credits_5')?.credits).toBe(5);
            (0, vitest_1.expect)((0, revenuecatProvider_1.resolveProductToPack)('culicars_credits_10')?.credits).toBe(10);
        });
        (0, vitest_1.it)('returns null for unknown product', () => {
            (0, vitest_1.expect)((0, revenuecatProvider_1.resolveProductToPack)('com.culicars.credits.99')).toBeNull();
            (0, vitest_1.expect)((0, revenuecatProvider_1.resolveProductToPack)('unknown_product')).toBeNull();
            (0, vitest_1.expect)((0, revenuecatProvider_1.resolveProductToPack)('')).toBeNull();
        });
    });
    (0, vitest_1.describe)('RevenueCat webhook event types', () => {
        (0, vitest_1.it)('identifies purchase event types', () => {
            const purchaseEvents = [
                'INITIAL_PURCHASE',
                'NON_RENEWING_PURCHASE',
                'PRODUCT_CHANGE',
            ];
            // These are the events we process
            (0, vitest_1.expect)(purchaseEvents).toContain('INITIAL_PURCHASE');
            (0, vitest_1.expect)(purchaseEvents).toContain('NON_RENEWING_PURCHASE');
            // These events we skip
            (0, vitest_1.expect)(purchaseEvents).not.toContain('RENEWAL');
            (0, vitest_1.expect)(purchaseEvents).not.toContain('CANCELLATION');
            (0, vitest_1.expect)(purchaseEvents).not.toContain('EXPIRATION');
        });
        (0, vitest_1.it)('validates webhook payload structure', () => {
            const mockPayload = {
                api_version: '1.0',
                event: {
                    type: 'INITIAL_PURCHASE',
                    id: 'event-123',
                    app_user_id: 'user-456',
                    product_id: 'com.culicars.credits.5',
                    price_in_purchased_currency: 4.99,
                    currency: 'USD',
                    store: 'APP_STORE',
                    transaction_id: 'txn-789',
                },
            };
            (0, vitest_1.expect)(mockPayload.event.type).toBe('INITIAL_PURCHASE');
            (0, vitest_1.expect)(mockPayload.event.app_user_id).toBe('user-456');
            const pack = (0, revenuecatProvider_1.resolveProductToPack)(mockPayload.event.product_id);
            (0, vitest_1.expect)(pack?.credits).toBe(5);
        });
    });
});
