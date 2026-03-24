"use strict";
// ============================================================
// CuliCars — Thread 4: OCR Confidence Tests
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ocrConfidence_1 = require("../services/ocrConfidence");
function makeVision(confidence) {
    return { fullText: 'test', blocks: [], confidence };
}
function makeExtraction(overrides = {}) {
    return {
        plates: [],
        vins: [],
        chassis: [],
        bestPlate: null,
        bestVin: null,
        bestChassis: null,
        overallConfidence: 0,
        ...overrides,
    };
}
(0, vitest_1.describe)('ocrConfidence', () => {
    (0, vitest_1.describe)('calculateOverallConfidence', () => {
        (0, vitest_1.it)('returns near 0 when nothing extracted', () => {
            const score = (0, ocrConfidence_1.calculateOverallConfidence)(makeVision(0.9), makeExtraction());
            // Vision confidence * 0.25 * 0.2 (penalty) = very low
            (0, vitest_1.expect)(score).toBeLessThan(0.1);
        });
        (0, vitest_1.it)('returns high score when plate + VIN + chassis all found', () => {
            const score = (0, ocrConfidence_1.calculateOverallConfidence)(makeVision(0.95), makeExtraction({
                bestPlate: { value: 'KCA123A', display: 'KCA 123A', confidence: 0.9, raw: 'KCA 123A' },
                bestVin: { value: 'JTDBR32E540012345', confidence: 0.9, raw: 'JTDBR32E540012345', isValid: true },
                bestChassis: { value: 'JTDBR32E540012345', confidence: 0.85, raw: 'JTDBR32E540012345' },
            }));
            (0, vitest_1.expect)(score).toBeGreaterThan(0.8);
        });
        (0, vitest_1.it)('gives cross-validation bonus when VIN matches chassis', () => {
            const withMatch = (0, ocrConfidence_1.calculateOverallConfidence)(makeVision(0.9), makeExtraction({
                bestVin: { value: 'JTDBR32E540012345', confidence: 0.85, raw: '', isValid: true },
                bestChassis: { value: 'JTDBR32E540012345', confidence: 0.8, raw: '' },
            }));
            const withoutMatch = (0, ocrConfidence_1.calculateOverallConfidence)(makeVision(0.9), makeExtraction({
                bestVin: { value: 'JTDBR32E540012345', confidence: 0.85, raw: '', isValid: true },
                bestChassis: { value: 'COMPLETELY000DIFF', confidence: 0.8, raw: '' },
            }));
            (0, vitest_1.expect)(withMatch).toBeGreaterThan(withoutMatch);
        });
        (0, vitest_1.it)('plate-only gives moderate score', () => {
            const score = (0, ocrConfidence_1.calculateOverallConfidence)(makeVision(0.9), makeExtraction({
                bestPlate: { value: 'KCA123A', display: 'KCA 123A', confidence: 0.9, raw: 'KCA 123A' },
            }));
            (0, vitest_1.expect)(score).toBeGreaterThan(0.3);
            (0, vitest_1.expect)(score).toBeLessThan(0.7);
        });
    });
    (0, vitest_1.describe)('confidenceLevel', () => {
        (0, vitest_1.it)('returns high for 0.8+', () => {
            (0, vitest_1.expect)((0, ocrConfidence_1.confidenceLevel)(0.85)).toBe('high');
            (0, vitest_1.expect)((0, ocrConfidence_1.confidenceLevel)(1.0)).toBe('high');
        });
        (0, vitest_1.it)('returns medium for 0.5-0.79', () => {
            (0, vitest_1.expect)((0, ocrConfidence_1.confidenceLevel)(0.5)).toBe('medium');
            (0, vitest_1.expect)((0, ocrConfidence_1.confidenceLevel)(0.79)).toBe('medium');
        });
        (0, vitest_1.it)('returns low for 0.01-0.49', () => {
            (0, vitest_1.expect)((0, ocrConfidence_1.confidenceLevel)(0.1)).toBe('low');
            (0, vitest_1.expect)((0, ocrConfidence_1.confidenceLevel)(0.49)).toBe('low');
        });
        (0, vitest_1.it)('returns none for 0', () => {
            (0, vitest_1.expect)((0, ocrConfidence_1.confidenceLevel)(0)).toBe('none');
        });
    });
});
