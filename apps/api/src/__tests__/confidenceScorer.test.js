"use strict";
// apps/api/src/__tests__/confidenceScorer.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const confidenceScorer_js_1 = require("../services/confidenceScorer.js");
(0, vitest_1.describe)('scoreContribution', () => {
    (0, vitest_1.it)('returns base score for minimal GENERAL_NOTE with no extras', () => {
        const factors = {
            contribType: 'GENERAL_NOTE',
            hasPhotos: false,
            hasVerificationDocs: false,
            isAuthenticatedUser: false,
            dataCompleteness: 0,
        };
        (0, vitest_1.expect)((0, confidenceScorer_js_1.scoreContribution)(factors)).toBe(0.3);
    });
    (0, vitest_1.it)('adds photo bonus', () => {
        const factors = {
            contribType: 'GENERAL_NOTE',
            hasPhotos: true,
            hasVerificationDocs: false,
            isAuthenticatedUser: false,
            dataCompleteness: 0,
        };
        (0, vitest_1.expect)((0, confidenceScorer_js_1.scoreContribution)(factors)).toBeCloseTo(0.35, 4);
    });
    (0, vitest_1.it)('adds verification doc bonus', () => {
        const factors = {
            contribType: 'GENERAL_NOTE',
            hasPhotos: false,
            hasVerificationDocs: true,
            isAuthenticatedUser: false,
            dataCompleteness: 0,
        };
        (0, vitest_1.expect)((0, confidenceScorer_js_1.scoreContribution)(factors)).toBeCloseTo(0.38, 4);
    });
    (0, vitest_1.it)('adds auth user bonus', () => {
        const factors = {
            contribType: 'GENERAL_NOTE',
            hasPhotos: false,
            hasVerificationDocs: false,
            isAuthenticatedUser: true,
            dataCompleteness: 0,
        };
        (0, vitest_1.expect)((0, confidenceScorer_js_1.scoreContribution)(factors)).toBeCloseTo(0.34, 4);
    });
    (0, vitest_1.it)('caps score at 0.65 regardless of bonuses', () => {
        const factors = {
            contribType: 'IMPORT_DOCUMENT',
            hasPhotos: true,
            hasVerificationDocs: true,
            isAuthenticatedUser: true,
            dataCompleteness: 1,
        };
        const score = (0, confidenceScorer_js_1.scoreContribution)(factors);
        (0, vitest_1.expect)(score).toBeLessThanOrEqual(0.65);
    });
    (0, vitest_1.it)('SERVICE_RECORD has higher base than GENERAL_NOTE', () => {
        const service = (0, confidenceScorer_js_1.scoreContribution)({
            contribType: 'SERVICE_RECORD',
            hasPhotos: false,
            hasVerificationDocs: false,
            isAuthenticatedUser: false,
            dataCompleteness: 0,
        });
        const note = (0, confidenceScorer_js_1.scoreContribution)({
            contribType: 'GENERAL_NOTE',
            hasPhotos: false,
            hasVerificationDocs: false,
            isAuthenticatedUser: false,
            dataCompleteness: 0,
        });
        (0, vitest_1.expect)(service).toBeGreaterThan(note);
    });
    (0, vitest_1.it)('score is always below NTSA trust threshold (0.9)', () => {
        const factors = {
            contribType: 'IMPORT_DOCUMENT',
            hasPhotos: true,
            hasVerificationDocs: true,
            isAuthenticatedUser: true,
            dataCompleteness: 1,
        };
        (0, vitest_1.expect)((0, confidenceScorer_js_1.scoreContribution)(factors)).toBeLessThan(0.9);
    });
});
(0, vitest_1.describe)('buildFactors', () => {
    (0, vitest_1.it)('calculates dataCompleteness correctly', () => {
        const factors = (0, confidenceScorer_js_1.buildFactors)({
            contribType: 'SERVICE_RECORD',
            evidenceUrls: ['photo.jpg'],
            verificationDocUrls: [],
            isAuthenticatedUser: true,
            dataFields: { date: '2024-01-01', mileage: 50000, garageName: '' },
        });
        // 2 of 3 fields filled → 0.666...
        (0, vitest_1.expect)(factors.dataCompleteness).toBeCloseTo(0.6667, 3);
        (0, vitest_1.expect)(factors.hasPhotos).toBe(true);
        (0, vitest_1.expect)(factors.hasVerificationDocs).toBe(false);
        (0, vitest_1.expect)(factors.isAuthenticatedUser).toBe(true);
    });
    (0, vitest_1.it)('handles empty data fields gracefully', () => {
        const factors = (0, confidenceScorer_js_1.buildFactors)({
            contribType: 'PHOTO_EVIDENCE',
            evidenceUrls: [],
            verificationDocUrls: [],
            isAuthenticatedUser: false,
            dataFields: {},
        });
        (0, vitest_1.expect)(factors.dataCompleteness).toBe(0);
    });
});
