"use strict";
// ============================================================
// CuliCars — Thread 5: Risk Calculator Tests
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const riskCalculator_1 = require("@culicars/utils/riskCalculator");
(0, vitest_1.describe)('riskCalculator', () => {
    (0, vitest_1.describe)('calculateRiskLevel', () => {
        (0, vitest_1.it)('returns clean for score 0', () => {
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRiskLevel)(0)).toBe('clean');
        });
        (0, vitest_1.it)('returns low for score 1–15', () => {
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRiskLevel)(5)).toBe('low');
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRiskLevel)(15)).toBe('low');
        });
        (0, vitest_1.it)('returns medium for score 16–35', () => {
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRiskLevel)(16)).toBe('medium');
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRiskLevel)(35)).toBe('medium');
        });
        (0, vitest_1.it)('returns high for score 36–60', () => {
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRiskLevel)(36)).toBe('high');
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRiskLevel)(60)).toBe('high');
        });
        (0, vitest_1.it)('returns critical for score 61+', () => {
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRiskLevel)(61)).toBe('critical');
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRiskLevel)(100)).toBe('critical');
        });
    });
    (0, vitest_1.describe)('calculateRecommendation', () => {
        (0, vitest_1.it)('returns proceed for clean/low', () => {
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRecommendation)('clean')).toBe('proceed');
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRecommendation)('low')).toBe('proceed');
        });
        (0, vitest_1.it)('returns caution for medium', () => {
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRecommendation)('medium')).toBe('caution');
        });
        (0, vitest_1.it)('returns avoid for high/critical', () => {
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRecommendation)('high')).toBe('avoid');
            (0, vitest_1.expect)((0, riskCalculator_1.calculateRecommendation)('critical')).toBe('avoid');
        });
    });
    (0, vitest_1.describe)('calculateRisk', () => {
        const cleanInput = {
            hasStolenReport: false,
            hasSevereDamage: false,
            hasMileageRollback: false,
            hasFinanceCaveat: false,
            hasFailedInspection: false,
            hasPsvHistory: false,
            ownershipChanges: 1,
            japanAuctionGrade: '4',
            hasNtsaData: true,
        };
        (0, vitest_1.it)('returns clean for no issues', () => {
            const result = (0, riskCalculator_1.calculateRisk)(cleanInput);
            (0, vitest_1.expect)(result.score).toBe(0);
            (0, vitest_1.expect)(result.level).toBe('clean');
            (0, vitest_1.expect)(result.recommendation).toBe('proceed');
            (0, vitest_1.expect)(result.factors).toHaveLength(0);
        });
        (0, vitest_1.it)('scores stolen report at 40 points', () => {
            const result = (0, riskCalculator_1.calculateRisk)({ ...cleanInput, hasStolenReport: true });
            (0, vitest_1.expect)(result.score).toBe(riskCalculator_1.RISK_WEIGHTS.STOLEN_WANTED);
            (0, vitest_1.expect)(result.level).toBe('high');
            (0, vitest_1.expect)(result.recommendation).toBe('avoid');
            (0, vitest_1.expect)(result.factors).toHaveLength(1);
            (0, vitest_1.expect)(result.factors[0].category).toBe('Theft');
        });
        (0, vitest_1.it)('scores severe damage at 30 points', () => {
            const result = (0, riskCalculator_1.calculateRisk)({ ...cleanInput, hasSevereDamage: true });
            (0, vitest_1.expect)(result.score).toBe(riskCalculator_1.RISK_WEIGHTS.SEVERE_STRUCTURAL);
            (0, vitest_1.expect)(result.level).toBe('medium');
        });
        (0, vitest_1.it)('scores mileage rollback at 25 points', () => {
            const result = (0, riskCalculator_1.calculateRisk)({ ...cleanInput, hasMileageRollback: true });
            (0, vitest_1.expect)(result.score).toBe(riskCalculator_1.RISK_WEIGHTS.MILEAGE_ROLLBACK);
            (0, vitest_1.expect)(result.level).toBe('medium');
        });
        (0, vitest_1.it)('scores failed inspection at 15 points', () => {
            const result = (0, riskCalculator_1.calculateRisk)({ ...cleanInput, hasFailedInspection: true });
            (0, vitest_1.expect)(result.score).toBe(riskCalculator_1.RISK_WEIGHTS.FAILED_INSPECTION);
            (0, vitest_1.expect)(result.level).toBe('low');
        });
        (0, vitest_1.it)('scores 4+ ownership changes at 10 points', () => {
            const result = (0, riskCalculator_1.calculateRisk)({ ...cleanInput, ownershipChanges: 5 });
            (0, vitest_1.expect)(result.score).toBe(riskCalculator_1.RISK_WEIGHTS.HIGH_OWNERSHIP);
        });
        (0, vitest_1.it)('does not penalize 3 or fewer ownership changes', () => {
            const result = (0, riskCalculator_1.calculateRisk)({ ...cleanInput, ownershipChanges: 3 });
            (0, vitest_1.expect)(result.score).toBe(0);
        });
        (0, vitest_1.it)('scores low auction grade at 10 points', () => {
            const result = (0, riskCalculator_1.calculateRisk)({ ...cleanInput, japanAuctionGrade: '2.5' });
            (0, vitest_1.expect)(result.score).toBe(riskCalculator_1.RISK_WEIGHTS.LOW_AUCTION_GRADE);
        });
        (0, vitest_1.it)('does not penalize auction grade 3+', () => {
            const result = (0, riskCalculator_1.calculateRisk)({ ...cleanInput, japanAuctionGrade: '3' });
            (0, vitest_1.expect)(result.score).toBe(0);
        });
        (0, vitest_1.it)('scores no NTSA data at 5 points', () => {
            const result = (0, riskCalculator_1.calculateRisk)({ ...cleanInput, hasNtsaData: false });
            (0, vitest_1.expect)(result.score).toBe(riskCalculator_1.RISK_WEIGHTS.NO_NTSA_DATA);
        });
        (0, vitest_1.it)('accumulates multiple factors', () => {
            const result = (0, riskCalculator_1.calculateRisk)({
                ...cleanInput,
                hasStolenReport: true, // +40
                hasSevereDamage: true, // +30
                hasMileageRollback: true, // +25
            });
            (0, vitest_1.expect)(result.score).toBe(95);
            (0, vitest_1.expect)(result.level).toBe('critical');
            (0, vitest_1.expect)(result.recommendation).toBe('avoid');
            (0, vitest_1.expect)(result.factors).toHaveLength(3);
        });
        (0, vitest_1.it)('caps score at 100', () => {
            const result = (0, riskCalculator_1.calculateRisk)({
                hasStolenReport: true, // +40
                hasSevereDamage: true, // +30
                hasMileageRollback: true, // +25
                hasFinanceCaveat: true, // +20
                hasFailedInspection: true, // +15
                hasPsvHistory: true, // +10
                ownershipChanges: 5, // +10
                japanAuctionGrade: '2', // +10
                hasNtsaData: false, // +5
            });
            // Total would be 165 but capped at 100
            (0, vitest_1.expect)(result.score).toBe(100);
            (0, vitest_1.expect)(result.level).toBe('critical');
        });
    });
});
