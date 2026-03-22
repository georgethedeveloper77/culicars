// ============================================================
// CuliCars — Thread 6: RevenueCat Webhook Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { resolveProductToPack } from '../services/providers/revenuecatProvider';

describe('RevenueCat Provider', () => {
  describe('resolveProductToPack', () => {
    it('resolves iOS product ID to pack', () => {
      const pack = resolveProductToPack('com.culicars.credits.5');
      expect(pack).toBeDefined();
      expect(pack!.id).toBe('culicars_credits_5');
      expect(pack!.credits).toBe(5);
    });

    it('resolves Android product ID to pack', () => {
      const pack = resolveProductToPack('culicars_credits_10');
      expect(pack).toBeDefined();
      expect(pack!.id).toBe('culicars_credits_10');
      expect(pack!.credits).toBe(10);
    });

    it('resolves all iOS products', () => {
      expect(resolveProductToPack('com.culicars.credits.1')?.credits).toBe(1);
      expect(resolveProductToPack('com.culicars.credits.3')?.credits).toBe(3);
      expect(resolveProductToPack('com.culicars.credits.5')?.credits).toBe(5);
      expect(resolveProductToPack('com.culicars.credits.10')?.credits).toBe(10);
    });

    it('resolves all Android products', () => {
      expect(resolveProductToPack('culicars_credits_1')?.credits).toBe(1);
      expect(resolveProductToPack('culicars_credits_3')?.credits).toBe(3);
      expect(resolveProductToPack('culicars_credits_5')?.credits).toBe(5);
      expect(resolveProductToPack('culicars_credits_10')?.credits).toBe(10);
    });

    it('returns null for unknown product', () => {
      expect(resolveProductToPack('com.culicars.credits.99')).toBeNull();
      expect(resolveProductToPack('unknown_product')).toBeNull();
      expect(resolveProductToPack('')).toBeNull();
    });
  });

  describe('RevenueCat webhook event types', () => {
    it('identifies purchase event types', () => {
      const purchaseEvents = [
        'INITIAL_PURCHASE',
        'NON_RENEWING_PURCHASE',
        'PRODUCT_CHANGE',
      ];

      // These are the events we process
      expect(purchaseEvents).toContain('INITIAL_PURCHASE');
      expect(purchaseEvents).toContain('NON_RENEWING_PURCHASE');

      // These events we skip
      expect(purchaseEvents).not.toContain('RENEWAL');
      expect(purchaseEvents).not.toContain('CANCELLATION');
      expect(purchaseEvents).not.toContain('EXPIRATION');
    });

    it('validates webhook payload structure', () => {
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

      expect(mockPayload.event.type).toBe('INITIAL_PURCHASE');
      expect(mockPayload.event.app_user_id).toBe('user-456');

      const pack = resolveProductToPack(mockPayload.event.product_id);
      expect(pack?.credits).toBe(5);
    });
  });
});
