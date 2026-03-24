"use strict";
// ============================================================
// CuliCars — Thread 5: Recommendation Section Tests
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const recommendationSection_1 = require("../services/sectionBuilders/recommendationSection");
(0, vitest_1.describe)('recommendationSection', () => {
    (0, vitest_1.it)('builds clean recommendation with no factors', () => {
        const riskResult = {
            score: 0,
            level: 'clean',
            recommendation: 'proceed',
            factors: [],
        };
        const result = (0, recommendationSection_1.buildRecommendationSection)(riskResult);
        (0, vitest_1.expect)(result.data.recommendation).toBe('proceed');
        (0, vitest_1.expect)(result.data.riskScore).toBe(0);
        (0, vitest_1.expect)(result.data.riskLevel).toBe('clean');
        (0, vitest_1.expect)(result.data.summary).toContain('clean history');
        (0, vitest_1.expect)(result.data.keyFindings).toHaveLength(1);
        (0, vitest_1.expect)(result.data.keyFindings[0].severity).toBe('info');
        (0, vitest_1.expect)(result.dataStatus).toBe('found');
    });
    (0, vitest_1.it)('builds critical recommendation with stolen report', () => {
        const riskResult = {
            score: 70,
            level: 'critical',
            recommendation: 'avoid',
            factors: [
                {
                    id: 'stolen_wanted',
                    category: 'Theft',
                    points: 40,
                    description: 'Vehicle has an active stolen/wanted report',
                },
                {
                    id: 'severe_structural',
                    category: 'Damage',
                    points: 30,
                    description: 'Severe structural damage recorded',
                },
            ],
        };
        const result = (0, recommendationSection_1.buildRecommendationSection)(riskResult);
        (0, vitest_1.expect)(result.data.recommendation).toBe('avoid');
        (0, vitest_1.expect)(result.data.riskLevel).toBe('critical');
        (0, vitest_1.expect)(result.data.keyFindings).toHaveLength(2);
        (0, vitest_1.expect)(result.data.keyFindings[0].severity).toBe('critical'); // 40 pts
        (0, vitest_1.expect)(result.data.keyFindings[1].severity).toBe('critical'); // 30 pts
        (0, vitest_1.expect)(result.data.breakdown).toHaveLength(2);
    });
    (0, vitest_1.it)('maps severity correctly based on points', () => {
        const riskResult = {
            score: 30,
            level: 'medium',
            recommendation: 'caution',
            factors: [
                { id: 'a', category: 'A', points: 5, description: 'Low' },
                { id: 'b', category: 'B', points: 15, description: 'Medium' },
                { id: 'c', category: 'C', points: 30, description: 'High' },
            ],
        };
        const result = (0, recommendationSection_1.buildRecommendationSection)(riskResult);
        (0, vitest_1.expect)(result.data.keyFindings[0].severity).toBe('info'); // 5 pts
        (0, vitest_1.expect)(result.data.keyFindings[1].severity).toBe('warning'); // 15 pts
        (0, vitest_1.expect)(result.data.keyFindings[2].severity).toBe('critical'); // 30 pts
    });
    (0, vitest_1.it)('includes breakdown matching risk factors', () => {
        const riskResult = {
            score: 25,
            level: 'medium',
            recommendation: 'caution',
            factors: [
                { id: 'rollback', category: 'Odometer', points: 25, description: 'Rollback detected' },
            ],
        };
        const result = (0, recommendationSection_1.buildRecommendationSection)(riskResult);
        (0, vitest_1.expect)(result.data.breakdown).toHaveLength(1);
        (0, vitest_1.expect)(result.data.breakdown[0].category).toBe('Odometer');
        (0, vitest_1.expect)(result.data.breakdown[0].points).toBe(25);
    });
});
