// ============================================================
// CuliCars — Thread 5: Risk Calculator Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  calculateRisk,
  calculateRiskLevel,
  calculateRecommendation,
  RISK_WEIGHTS,
  type RiskInput,
} from '@culicars/utils/riskCalculator';

describe('riskCalculator', () => {
  describe('calculateRiskLevel', () => {
    it('returns clean for score 0', () => {
      expect(calculateRiskLevel(0)).toBe('clean');
    });

    it('returns low for score 1–15', () => {
      expect(calculateRiskLevel(5)).toBe('low');
      expect(calculateRiskLevel(15)).toBe('low');
    });

    it('returns medium for score 16–35', () => {
      expect(calculateRiskLevel(16)).toBe('medium');
      expect(calculateRiskLevel(35)).toBe('medium');
    });

    it('returns high for score 36–60', () => {
      expect(calculateRiskLevel(36)).toBe('high');
      expect(calculateRiskLevel(60)).toBe('high');
    });

    it('returns critical for score 61+', () => {
      expect(calculateRiskLevel(61)).toBe('critical');
      expect(calculateRiskLevel(100)).toBe('critical');
    });
  });

  describe('calculateRecommendation', () => {
    it('returns proceed for clean/low', () => {
      expect(calculateRecommendation('clean')).toBe('proceed');
      expect(calculateRecommendation('low')).toBe('proceed');
    });

    it('returns caution for medium', () => {
      expect(calculateRecommendation('medium')).toBe('caution');
    });

    it('returns avoid for high/critical', () => {
      expect(calculateRecommendation('high')).toBe('avoid');
      expect(calculateRecommendation('critical')).toBe('avoid');
    });
  });

  describe('calculateRisk', () => {
    const cleanInput: RiskInput = {
      hasStolenReport: false,
      hasSevereDamage: false,
      hasMileageRollback: false,
      hasFinanceCaveat: false,
      hasFailedInspection: false,
      hasPsvHistory: false,
      ownershipChanges: 1,
      japan_auction_grade: '4',
      hasNtsaData: true,
    };

    it('returns clean for no issues', () => {
      const result = calculateRisk(cleanInput);
      expect(result.score).toBe(0);
      expect(result.level).toBe('clean');
      expect(result.recommendation).toBe('proceed');
      expect(result.factors).toHaveLength(0);
    });

    it('scores stolen report at 40 points', () => {
      const result = calculateRisk({ ...cleanInput, hasStolenReport: true });
      expect(result.score).toBe(RISK_WEIGHTS.STOLEN_WANTED);
      expect(result.level).toBe('high');
      expect(result.recommendation).toBe('avoid');
      expect(result.factors).toHaveLength(1);
      expect(result.factors[0].category).toBe('Theft');
    });

    it('scores severe damage at 30 points', () => {
      const result = calculateRisk({ ...cleanInput, hasSevereDamage: true });
      expect(result.score).toBe(RISK_WEIGHTS.SEVERE_STRUCTURAL);
      expect(result.level).toBe('medium');
    });

    it('scores mileage rollback at 25 points', () => {
      const result = calculateRisk({ ...cleanInput, hasMileageRollback: true });
      expect(result.score).toBe(RISK_WEIGHTS.MILEAGE_ROLLBACK);
      expect(result.level).toBe('medium');
    });

    it('scores failed inspection at 15 points', () => {
      const result = calculateRisk({ ...cleanInput, hasFailedInspection: true });
      expect(result.score).toBe(RISK_WEIGHTS.FAILED_INSPECTION);
      expect(result.level).toBe('low');
    });

    it('scores 4+ ownership changes at 10 points', () => {
      const result = calculateRisk({ ...cleanInput, ownershipChanges: 5 });
      expect(result.score).toBe(RISK_WEIGHTS.HIGH_OWNERSHIP);
    });

    it('does not penalize 3 or fewer ownership changes', () => {
      const result = calculateRisk({ ...cleanInput, ownershipChanges: 3 });
      expect(result.score).toBe(0);
    });

    it('scores low auction grade at 10 points', () => {
      const result = calculateRisk({ ...cleanInput, japan_auction_grade: '2.5' });
      expect(result.score).toBe(RISK_WEIGHTS.LOW_AUCTION_GRADE);
    });

    it('does not penalize auction grade 3+', () => {
      const result = calculateRisk({ ...cleanInput, japan_auction_grade: '3' });
      expect(result.score).toBe(0);
    });

    it('scores no NTSA data at 5 points', () => {
      const result = calculateRisk({ ...cleanInput, hasNtsaData: false });
      expect(result.score).toBe(RISK_WEIGHTS.NO_NTSA_DATA);
    });

    it('accumulates multiple factors', () => {
      const result = calculateRisk({
        ...cleanInput,
        hasStolenReport: true,      // +40
        hasSevereDamage: true,       // +30
        hasMileageRollback: true,    // +25
      });
      expect(result.score).toBe(95);
      expect(result.level).toBe('critical');
      expect(result.recommendation).toBe('avoid');
      expect(result.factors).toHaveLength(3);
    });

    it('caps score at 100', () => {
      const result = calculateRisk({
        hasStolenReport: true,       // +40
        hasSevereDamage: true,       // +30
        hasMileageRollback: true,    // +25
        hasFinanceCaveat: true,      // +20
        hasFailedInspection: true,   // +15
        hasPsvHistory: true,         // +10
        ownershipChanges: 5,         // +10
        japan_auction_grade: '2',      // +10
        hasNtsaData: false,          // +5
      });
      // Total would be 165 but capped at 100
      expect(result.score).toBe(100);
      expect(result.level).toBe('critical');
    });
  });
});
