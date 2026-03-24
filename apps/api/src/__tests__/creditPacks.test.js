"use strict";
// ============================================================
// CuliCars — Thread 6: Credit Packs Tests
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const creditPacks_1 = require("../config/creditPacks");
(0, vitest_1.describe)('creditPacks', () => {
    (0, vitest_1.describe)('CREDIT_PACKS', () => {
        (0, vitest_1.it)('has exactly 4 packs', () => {
            (0, vitest_1.expect)(creditPacks_1.CREDIT_PACKS).toHaveLength(4);
        });
        (0, vitest_1.it)('has correct pack IDs', () => {
            const ids = creditPacks_1.CREDIT_PACKS.map((p) => p.id);
            (0, vitest_1.expect)(ids).toEqual([
                'culicars_credits_1',
                'culicars_credits_3',
                'culicars_credits_5',
                'culicars_credits_10',
            ]);
        });
        (0, vitest_1.it)('has correct KES prices', () => {
            const prices = creditPacks_1.CREDIT_PACKS.map((p) => p.priceKes);
            (0, vitest_1.expect)(prices).toEqual([150, 400, 600, 1000]);
        });
        (0, vitest_1.it)('has correct USD prices', () => {
            const prices = creditPacks_1.CREDIT_PACKS.map((p) => p.priceUsd);
            (0, vitest_1.expect)(prices).toEqual([1.0, 3.0, 5.0, 9.0]);
        });
        (0, vitest_1.it)('marks 5-credit pack as popular', () => {
            const popular = creditPacks_1.CREDIT_PACKS.find((p) => p.popular);
            (0, vitest_1.expect)(popular?.id).toBe('culicars_credits_5');
        });
        (0, vitest_1.it)('marks 10-credit pack as Dealer Pack', () => {
            const dealer = creditPacks_1.CREDIT_PACKS.find((p) => p.tag === 'Dealer Pack');
            (0, vitest_1.expect)(dealer?.id).toBe('culicars_credits_10');
        });
        (0, vitest_1.it)('all packs have positive credits and prices', () => {
            for (const pack of creditPacks_1.CREDIT_PACKS) {
                (0, vitest_1.expect)(pack.credits).toBeGreaterThan(0);
                (0, vitest_1.expect)(pack.priceKes).toBeGreaterThan(0);
                (0, vitest_1.expect)(pack.priceUsd).toBeGreaterThan(0);
            }
        });
    });
    (0, vitest_1.describe)('getPackById', () => {
        (0, vitest_1.it)('returns pack for valid ID', () => {
            const pack = (0, creditPacks_1.getPackById)('culicars_credits_5');
            (0, vitest_1.expect)(pack).toBeDefined();
            (0, vitest_1.expect)(pack.credits).toBe(5);
            (0, vitest_1.expect)(pack.priceKes).toBe(600);
        });
        (0, vitest_1.it)('returns undefined for invalid ID', () => {
            (0, vitest_1.expect)((0, creditPacks_1.getPackById)('nonexistent')).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('getPackPrice', () => {
        const pack = creditPacks_1.CREDIT_PACKS[0]; // 1 credit
        (0, vitest_1.it)('returns KES for mpesa', () => {
            const result = (0, creditPacks_1.getPackPrice)(pack, 'mpesa');
            (0, vitest_1.expect)(result).toEqual({ amount: 150, currency: 'KES' });
        });
        (0, vitest_1.it)('returns KES for card', () => {
            const result = (0, creditPacks_1.getPackPrice)(pack, 'card');
            (0, vitest_1.expect)(result).toEqual({ amount: 150, currency: 'KES' });
        });
        (0, vitest_1.it)('returns USD for paypal', () => {
            const result = (0, creditPacks_1.getPackPrice)(pack, 'paypal');
            (0, vitest_1.expect)(result).toEqual({ amount: 1.0, currency: 'USD' });
        });
        (0, vitest_1.it)('returns USD for stripe', () => {
            const result = (0, creditPacks_1.getPackPrice)(pack, 'stripe');
            (0, vitest_1.expect)(result).toEqual({ amount: 1.0, currency: 'USD' });
        });
        (0, vitest_1.it)('returns USD for revenuecat', () => {
            const result = (0, creditPacks_1.getPackPrice)(pack, 'revenuecat');
            (0, vitest_1.expect)(result).toEqual({ amount: 1.0, currency: 'USD' });
        });
        (0, vitest_1.it)('defaults to KES for unknown provider', () => {
            const result = (0, creditPacks_1.getPackPrice)(pack, 'unknown');
            (0, vitest_1.expect)(result).toEqual({ amount: 150, currency: 'KES' });
        });
    });
    (0, vitest_1.describe)('formatPacksForResponse', () => {
        (0, vitest_1.it)('returns all 4 packs', () => {
            const result = (0, creditPacks_1.formatPacksForResponse)();
            (0, vitest_1.expect)(result).toHaveLength(4);
        });
        (0, vitest_1.it)('includes both KES and USD prices', () => {
            const result = (0, creditPacks_1.formatPacksForResponse)();
            for (const pack of result) {
                (0, vitest_1.expect)(pack).toHaveProperty('priceKes');
                (0, vitest_1.expect)(pack).toHaveProperty('priceUsd');
            }
        });
        (0, vitest_1.it)('normalizes popular/tag to non-undefined', () => {
            const result = (0, creditPacks_1.formatPacksForResponse)();
            for (const pack of result) {
                (0, vitest_1.expect)(typeof pack.popular).toBe('boolean');
                // tag is either string or null, never undefined
                (0, vitest_1.expect)(pack.tag === null || typeof pack.tag === 'string').toBe(true);
            }
        });
    });
});
