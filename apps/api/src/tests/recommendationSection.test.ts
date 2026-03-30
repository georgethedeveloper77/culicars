// ============================================================
// CuliCars — Thread 5: Recommendation Section Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { buildRecommendationSection } from '../services/sectionBuilders/recommendationSection';
import type { RiskResult } from '@culicars/utils/riskCalculator';

describe('recommendationSection', () => {
  it('builds clean recommendation with no factors', () => {
    const riskResult: RiskResult = {
      score: 0,
      level: 'clean',
      recommendation: 'proceed',
      factors: [],
    };

    const result = buildRecommendationSection(riskResult);
    expect(result.data.recommendation).toBe('proceed');
    expect(result.data.risk_score).toBe(0);
    expect(result.data.risk_level).toBe('clean');
    expect(result.data.summary).toContain('clean history');
    expect(result.data.keyFindings).toHaveLength(1);
    expect(result.data.keyFindings[0].severity).toBe('info');
    expect(result.data_status).toBe('found');
  });

  it('builds critical recommendation with stolen report', () => {
    const riskResult: RiskResult = {
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

    const result = buildRecommendationSection(riskResult);
    expect(result.data.recommendation).toBe('avoid');
    expect(result.data.risk_level).toBe('critical');
    expect(result.data.keyFindings).toHaveLength(2);
    expect(result.data.keyFindings[0].severity).toBe('critical'); // 40 pts
    expect(result.data.keyFindings[1].severity).toBe('critical'); // 30 pts
    expect(result.data.breakdown).toHaveLength(2);
  });

  it('maps severity correctly based on points', () => {
    const riskResult: RiskResult = {
      score: 30,
      level: 'medium',
      recommendation: 'caution',
      factors: [
        { id: 'a', category: 'A', points: 5, description: 'Low' },
        { id: 'b', category: 'B', points: 15, description: 'Medium' },
        { id: 'c', category: 'C', points: 30, description: 'High' },
      ],
    };

    const result = buildRecommendationSection(riskResult);
    expect(result.data.keyFindings[0].severity).toBe('info');     // 5 pts
    expect(result.data.keyFindings[1].severity).toBe('warning');  // 15 pts
    expect(result.data.keyFindings[2].severity).toBe('critical'); // 30 pts
  });

  it('includes breakdown matching risk factors', () => {
    const riskResult: RiskResult = {
      score: 25,
      level: 'medium',
      recommendation: 'caution',
      factors: [
        { id: 'rollback', category: 'Odometer', points: 25, description: 'Rollback detected' },
      ],
    };

    const result = buildRecommendationSection(riskResult);
    expect(result.data.breakdown).toHaveLength(1);
    expect(result.data.breakdown[0].category).toBe('Odometer');
    expect(result.data.breakdown[0].points).toBe(25);
  });
});
