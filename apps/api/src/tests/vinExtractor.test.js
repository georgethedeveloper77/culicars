"use strict";
// ============================================================
// CuliCars — Thread 4: VIN Extractor Tests
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vinExtractor_1 = require("../services/vinExtractor");
(0, vitest_1.describe)('vinExtractor', () => {
    (0, vitest_1.describe)('valid VINs', () => {
        (0, vitest_1.it)('extracts a clean 17-char VIN', () => {
            const result = (0, vinExtractor_1.extractVins)('VIN: JTDBR32E540012345');
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].value).toBe('JTDBR32E540012345');
        });
        (0, vitest_1.it)('extracts VIN without label', () => {
            const result = (0, vinExtractor_1.extractVins)('The vehicle JTDBR32E540012345 was imported');
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].value).toBe('JTDBR32E540012345');
        });
        (0, vitest_1.it)('extracts VIN with spaces (loose pattern)', () => {
            const result = (0, vinExtractor_1.extractVins)('Chassis: JTD BR32E5 40012345');
            (0, vitest_1.expect)(result.length).toBeGreaterThanOrEqual(1);
            // Should clean spaces
            const cleaned = result.find((r) => r.value.length === 17);
            (0, vitest_1.expect)(cleaned).toBeTruthy();
        });
        (0, vitest_1.it)('boosts confidence near VIN keywords', () => {
            const withKeyword = (0, vinExtractor_1.extractVins)('VIN Number: JTDBR32E540012345');
            const withoutKeyword = (0, vinExtractor_1.extractVins)('Random JTDBR32E540012345 text');
            if (withKeyword.length && withoutKeyword.length) {
                (0, vitest_1.expect)(withKeyword[0].confidence).toBeGreaterThanOrEqual(withoutKeyword[0].confidence);
            }
        });
    });
    (0, vitest_1.describe)('multiple VINs', () => {
        (0, vitest_1.it)('extracts two different VINs', () => {
            const result = (0, vinExtractor_1.extractVins)('VIN1: JTDBR32E540012345 and VIN2: JTDKN3DU5A0056789');
            (0, vitest_1.expect)(result).toHaveLength(2);
        });
    });
    (0, vitest_1.describe)('edge cases', () => {
        (0, vitest_1.it)('returns empty for no VINs', () => {
            (0, vitest_1.expect)((0, vinExtractor_1.extractVins)('No VIN here')).toHaveLength(0);
        });
        (0, vitest_1.it)('returns empty for empty string', () => {
            (0, vitest_1.expect)((0, vinExtractor_1.extractVins)('')).toHaveLength(0);
        });
        (0, vitest_1.it)('rejects strings with I, O, Q (invalid VIN chars)', () => {
            const result = (0, vinExtractor_1.extractVins)('JTDBR32E54OO12345'); // O not 0
            // Should either not match or flag as invalid
            const validOnes = result.filter((r) => r.isValid);
            (0, vitest_1.expect)(validOnes).toHaveLength(0);
        });
        (0, vitest_1.it)('deduplicates same VIN', () => {
            const result = (0, vinExtractor_1.extractVins)('JTDBR32E540012345 ... JTDBR32E540012345');
            (0, vitest_1.expect)(result).toHaveLength(1);
        });
    });
});
