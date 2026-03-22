// ============================================================
// CuliCars — Thread 6: Credit Packs Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  CREDIT_PACKS,
  getPackById,
  getPackPrice,
  formatPacksForResponse,
} from '../config/creditPacks';

describe('creditPacks', () => {
  describe('CREDIT_PACKS', () => {
    it('has exactly 4 packs', () => {
      expect(CREDIT_PACKS).toHaveLength(4);
    });

    it('has correct pack IDs', () => {
      const ids = CREDIT_PACKS.map((p) => p.id);
      expect(ids).toEqual([
        'culicars_credits_1',
        'culicars_credits_3',
        'culicars_credits_5',
        'culicars_credits_10',
      ]);
    });

    it('has correct KES prices', () => {
      const prices = CREDIT_PACKS.map((p) => p.priceKes);
      expect(prices).toEqual([150, 400, 600, 1000]);
    });

    it('has correct USD prices', () => {
      const prices = CREDIT_PACKS.map((p) => p.priceUsd);
      expect(prices).toEqual([1.0, 3.0, 5.0, 9.0]);
    });

    it('marks 5-credit pack as popular', () => {
      const popular = CREDIT_PACKS.find((p) => p.popular);
      expect(popular?.id).toBe('culicars_credits_5');
    });

    it('marks 10-credit pack as Dealer Pack', () => {
      const dealer = CREDIT_PACKS.find((p) => p.tag === 'Dealer Pack');
      expect(dealer?.id).toBe('culicars_credits_10');
    });

    it('all packs have positive credits and prices', () => {
      for (const pack of CREDIT_PACKS) {
        expect(pack.credits).toBeGreaterThan(0);
        expect(pack.priceKes).toBeGreaterThan(0);
        expect(pack.priceUsd).toBeGreaterThan(0);
      }
    });
  });

  describe('getPackById', () => {
    it('returns pack for valid ID', () => {
      const pack = getPackById('culicars_credits_5');
      expect(pack).toBeDefined();
      expect(pack!.credits).toBe(5);
      expect(pack!.priceKes).toBe(600);
    });

    it('returns undefined for invalid ID', () => {
      expect(getPackById('nonexistent')).toBeUndefined();
    });
  });

  describe('getPackPrice', () => {
    const pack = CREDIT_PACKS[0]; // 1 credit

    it('returns KES for mpesa', () => {
      const result = getPackPrice(pack, 'mpesa');
      expect(result).toEqual({ amount: 150, currency: 'KES' });
    });

    it('returns KES for card', () => {
      const result = getPackPrice(pack, 'card');
      expect(result).toEqual({ amount: 150, currency: 'KES' });
    });

    it('returns USD for paypal', () => {
      const result = getPackPrice(pack, 'paypal');
      expect(result).toEqual({ amount: 1.0, currency: 'USD' });
    });

    it('returns USD for stripe', () => {
      const result = getPackPrice(pack, 'stripe');
      expect(result).toEqual({ amount: 1.0, currency: 'USD' });
    });

    it('returns USD for revenuecat', () => {
      const result = getPackPrice(pack, 'revenuecat');
      expect(result).toEqual({ amount: 1.0, currency: 'USD' });
    });

    it('defaults to KES for unknown provider', () => {
      const result = getPackPrice(pack, 'unknown');
      expect(result).toEqual({ amount: 150, currency: 'KES' });
    });
  });

  describe('formatPacksForResponse', () => {
    it('returns all 4 packs', () => {
      const result = formatPacksForResponse();
      expect(result).toHaveLength(4);
    });

    it('includes both KES and USD prices', () => {
      const result = formatPacksForResponse();
      for (const pack of result) {
        expect(pack).toHaveProperty('priceKes');
        expect(pack).toHaveProperty('priceUsd');
      }
    });

    it('normalizes popular/tag to non-undefined', () => {
      const result = formatPacksForResponse();
      for (const pack of result) {
        expect(typeof pack.popular).toBe('boolean');
        // tag is either string or null, never undefined
        expect(pack.tag === null || typeof pack.tag === 'string').toBe(true);
      }
    });
  });
});
