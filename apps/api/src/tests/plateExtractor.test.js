"use strict";
// ============================================================
// CuliCars — Thread 4: Plate Extractor Tests
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const plateExtractor_1 = require("../services/plateExtractor");
(0, vitest_1.describe)('plateExtractor', () => {
    (0, vitest_1.describe)('KXX 000X format (post-2004)', () => {
        (0, vitest_1.it)('extracts standard plate from clean text', () => {
            const result = (0, plateExtractor_1.extractPlates)('Registration Number: KCA 123A');
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].value).toBe('KCA123A');
            (0, vitest_1.expect)(result[0].display).toBe('KCA 123A');
        });
        (0, vitest_1.it)('extracts plate without spaces', () => {
            const result = (0, plateExtractor_1.extractPlates)('Vehicle: KCA123A registered');
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].value).toBe('KCA123A');
        });
        (0, vitest_1.it)('extracts plate with extra spaces', () => {
            const result = (0, plateExtractor_1.extractPlates)('Plate: KCA  123  A');
            (0, vitest_1.expect)(result.length).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(result[0].value).toBe('KCA123A');
        });
        (0, vitest_1.it)('extracts multiple plates from same text', () => {
            const result = (0, plateExtractor_1.extractPlates)('KCA 123A was sold. New plate KDG 456B.');
            (0, vitest_1.expect)(result).toHaveLength(2);
            const values = result.map((r) => r.value);
            (0, vitest_1.expect)(values).toContain('KCA123A');
            (0, vitest_1.expect)(values).toContain('KDG456B');
        });
        (0, vitest_1.it)('boosts confidence when near registration keywords', () => {
            const withKeyword = (0, plateExtractor_1.extractPlates)('Registration Number: KCA 123A');
            const withoutKeyword = (0, plateExtractor_1.extractPlates)('text KCA 123A more text');
            (0, vitest_1.expect)(withKeyword[0].confidence).toBeGreaterThan(withoutKeyword[0].confidence);
        });
    });
    (0, vitest_1.describe)('KXX 000 format (older)', () => {
        (0, vitest_1.it)('extracts older format plate', () => {
            const result = (0, plateExtractor_1.extractPlates)('Reg: KAA 123');
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].value).toBe('KAA123');
        });
    });
    (0, vitest_1.describe)('Government plates', () => {
        (0, vitest_1.it)('extracts GK plate', () => {
            const result = (0, plateExtractor_1.extractPlates)('GK 1234A');
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].value).toMatch(/^GK/);
        });
        (0, vitest_1.it)('extracts CD plate', () => {
            const result = (0, plateExtractor_1.extractPlates)('CD 123');
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].value).toMatch(/^CD/);
        });
        (0, vitest_1.it)('extracts UN plate', () => {
            const result = (0, plateExtractor_1.extractPlates)('UN 4567');
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].value).toMatch(/^UN/);
        });
    });
    (0, vitest_1.describe)('edge cases', () => {
        (0, vitest_1.it)('returns empty for no plates', () => {
            (0, vitest_1.expect)((0, plateExtractor_1.extractPlates)('No plate here')).toHaveLength(0);
        });
        (0, vitest_1.it)('returns empty for empty string', () => {
            (0, vitest_1.expect)((0, plateExtractor_1.extractPlates)('')).toHaveLength(0);
        });
        (0, vitest_1.it)('deduplicates same plate', () => {
            const result = (0, plateExtractor_1.extractPlates)('KCA 123A ... KCA123A');
            (0, vitest_1.expect)(result).toHaveLength(1);
        });
        (0, vitest_1.it)('handles noisy OCR text', () => {
            const result = (0, plateExtractor_1.extractPlates)('REG. NO.  KCA  123A\n  TOYOTA FIELDER');
            (0, vitest_1.expect)(result.length).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(result[0].value).toBe('KCA123A');
        });
    });
});
