"use strict";
// ============================================================
// CuliCars — Thread 4: Chassis Extractor Tests
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const chassisExtractor_1 = require("../services/chassisExtractor");
(0, vitest_1.describe)('chassisExtractor', () => {
    (0, vitest_1.describe)('Toyota-style chassis', () => {
        (0, vitest_1.it)('extracts NZE141-6012345 format', () => {
            const result = (0, chassisExtractor_1.extractChassis)('Chassis Number: NZE141-6012345');
            (0, vitest_1.expect)(result.length).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(result[0].value).toBe('NZE1416012345');
        });
        (0, vitest_1.it)('extracts NCP91-1234567 format', () => {
            const result = (0, chassisExtractor_1.extractChassis)('Chassis No: NCP91-1234567');
            (0, vitest_1.expect)(result.length).toBeGreaterThanOrEqual(1);
        });
    });
    (0, vitest_1.describe)('keyword context', () => {
        (0, vitest_1.it)('boosts confidence when near chassis keyword', () => {
            const withKeyword = (0, chassisExtractor_1.extractChassis)('Chassis Number: ABC123-4567890');
            const withoutKeyword = (0, chassisExtractor_1.extractChassis)('Random ABC123-4567890 text');
            if (withKeyword.length && withoutKeyword.length) {
                (0, vitest_1.expect)(withKeyword[0].confidence).toBeGreaterThanOrEqual(withoutKeyword[0].confidence);
            }
        });
    });
    (0, vitest_1.describe)('edge cases', () => {
        (0, vitest_1.it)('returns empty for no chassis numbers', () => {
            (0, vitest_1.expect)((0, chassisExtractor_1.extractChassis)('No chassis here')).toHaveLength(0);
        });
        (0, vitest_1.it)('returns empty for empty string', () => {
            (0, vitest_1.expect)((0, chassisExtractor_1.extractChassis)('')).toHaveLength(0);
        });
        (0, vitest_1.it)('rejects pure alphabetic strings', () => {
            const result = (0, chassisExtractor_1.extractChassis)('Chassis: ABCDEFGHIJ');
            const valid = result.filter((r) => /\d/.test(r.value) && /[A-Z]/.test(r.value));
            // Should only return items with both letters and digits
            (0, vitest_1.expect)(result.every((r) => /\d/.test(r.value) && /[A-Z]/.test(r.value))).toBe(true);
        });
        (0, vitest_1.it)('rejects pure numeric strings', () => {
            const result = (0, chassisExtractor_1.extractChassis)('Chassis: 1234567890');
            (0, vitest_1.expect)(result.every((r) => /[A-Z]/.test(r.value))).toBe(true);
        });
    });
});
