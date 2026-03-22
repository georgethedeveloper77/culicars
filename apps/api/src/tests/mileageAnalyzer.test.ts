// ============================================================
// CuliCars — Thread 5: Mileage Analyzer Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  analyzeMileage,
  estimateAverageForSimilar,
  type MileageEntry,
} from '@culicars/utils/mileageAnalyzer';

describe('mileageAnalyzer', () => {
  describe('analyzeMileage', () => {
    it('returns empty analysis for no entries', () => {
      const result = analyzeMileage([]);
      expect(result.lastKnownMileage).toBeNull();
      expect(result.rollbackDetected).toBe(false);
      expect(result.rollbackCount).toBe(0);
      expect(result.records).toHaveLength(0);
      expect(result.chartData).toHaveLength(0);
    });

    it('handles single entry', () => {
      const entries: MileageEntry[] = [
        { date: '2020-06-01', mileage: 50000, source: 'listing' },
      ];
      const result = analyzeMileage(entries);
      expect(result.lastKnownMileage).toBe(50000);
      expect(result.rollbackDetected).toBe(false);
      expect(result.records).toHaveLength(1);
      expect(result.records[0].isRollback).toBe(false);
    });

    it('detects normal ascending mileage', () => {
      const entries: MileageEntry[] = [
        { date: '2019-01-01', mileage: 30000, source: 'auction' },
        { date: '2020-06-01', mileage: 50000, source: 'listing' },
        { date: '2022-01-01', mileage: 80000, source: 'service' },
      ];
      const result = analyzeMileage(entries);
      expect(result.lastKnownMileage).toBe(80000);
      expect(result.rollbackDetected).toBe(false);
      expect(result.rollbackCount).toBe(0);
      expect(result.records.every((r) => !r.isRollback)).toBe(true);
    });

    it('detects rollback when mileage drops > 500km', () => {
      const entries: MileageEntry[] = [
        { date: '2019-01-01', mileage: 30000, source: 'auction' },
        { date: '2020-06-01', mileage: 80000, source: 'listing' },
        { date: '2022-01-01', mileage: 50000, source: 'service' }, // ROLLBACK
      ];
      const result = analyzeMileage(entries);
      expect(result.rollbackDetected).toBe(true);
      expect(result.rollbackCount).toBe(1);
      expect(result.totalRollbackKm).toBe(30000);
      expect(result.records[2].isRollback).toBe(true);
      expect(result.records[2].rollbackAmount).toBe(30000);
    });

    it('ignores small drops < 500km (rounding tolerance)', () => {
      const entries: MileageEntry[] = [
        { date: '2020-01-01', mileage: 50000, source: 'listing' },
        { date: '2021-01-01', mileage: 49800, source: 'service' }, // -200, within tolerance
      ];
      const result = analyzeMileage(entries);
      expect(result.rollbackDetected).toBe(false);
    });

    it('detects multiple rollbacks', () => {
      const entries: MileageEntry[] = [
        { date: '2018-01-01', mileage: 20000, source: 'import' },
        { date: '2019-06-01', mileage: 60000, source: 'listing' },
        { date: '2020-01-01', mileage: 40000, source: 'listing' }, // rollback 1
        { date: '2021-01-01', mileage: 70000, source: 'service' },
        { date: '2022-01-01', mileage: 45000, source: 'listing' }, // rollback 2
      ];
      const result = analyzeMileage(entries);
      expect(result.rollbackDetected).toBe(true);
      expect(result.rollbackCount).toBe(2);
    });

    it('sorts entries chronologically regardless of input order', () => {
      const entries: MileageEntry[] = [
        { date: '2022-01-01', mileage: 80000, source: 'service' },
        { date: '2019-01-01', mileage: 30000, source: 'auction' },
        { date: '2020-06-01', mileage: 50000, source: 'listing' },
      ];
      const result = analyzeMileage(entries);
      expect(result.records[0].date).toBe('2019-01-01');
      expect(result.records[1].date).toBe('2020-06-01');
      expect(result.records[2].date).toBe('2022-01-01');
      expect(result.rollbackDetected).toBe(false);
    });

    it('generates chart data with rollback flags', () => {
      const entries: MileageEntry[] = [
        { date: '2019-01-01', mileage: 30000, source: 'auction' },
        { date: '2020-06-01', mileage: 80000, source: 'listing' },
        { date: '2022-01-01', mileage: 50000, source: 'service' },
      ];
      const result = analyzeMileage(entries);
      expect(result.chartData).toHaveLength(3);
      expect(result.chartData[2].isRollback).toBe(true);
    });

    it('calculates average annual km', () => {
      const entries: MileageEntry[] = [
        { date: '2019-01-01', mileage: 30000, source: 'import' },
        { date: '2022-01-01', mileage: 75000, source: 'service' },
      ];
      const result = analyzeMileage(entries);
      expect(result.averageAnnualKm).toBeGreaterThan(14000);
      expect(result.averageAnnualKm).toBeLessThan(16000);
    });

    it('returns null averageAnnualKm for < 3 months of data', () => {
      const entries: MileageEntry[] = [
        { date: '2022-01-01', mileage: 50000, source: 'listing' },
        { date: '2022-02-01', mileage: 51000, source: 'service' },
      ];
      const result = analyzeMileage(entries);
      expect(result.averageAnnualKm).toBeNull();
    });

    it('uses custom rollback threshold', () => {
      const entries: MileageEntry[] = [
        { date: '2020-01-01', mileage: 50000, source: 'listing' },
        { date: '2021-01-01', mileage: 49000, source: 'service' }, // -1000
      ];
      // Default threshold 500 → this is a rollback
      expect(analyzeMileage(entries, 500).rollbackDetected).toBe(true);
      // Higher threshold 2000 → this is within tolerance
      expect(analyzeMileage(entries, 2000).rollbackDetected).toBe(false);
    });
  });

  describe('estimateAverageForSimilar', () => {
    it('returns null for null year', () => {
      const result = estimateAverageForSimilar(null);
      expect(result.average).toBeNull();
      expect(result.description).toBeNull();
    });

    it('returns null for current/future year', () => {
      const result = estimateAverageForSimilar(new Date().getFullYear() + 1);
      expect(result.average).toBeNull();
    });

    it('calculates average based on vehicle age', () => {
      const year = new Date().getFullYear() - 10; // 10 years old
      const result = estimateAverageForSimilar(year, 'Toyota', 'Fielder');
      expect(result.average).toBe(150000); // 15000 * 10
      expect(result.description).toContain('Toyota');
      expect(result.description).toContain('Fielder');
    });

    it('includes make and model in description', () => {
      const year = new Date().getFullYear() - 5;
      const result = estimateAverageForSimilar(year, 'Honda', 'Fit');
      expect(result.description).toContain('Honda Fit');
    });

    it('uses generic description without make/model', () => {
      const year = new Date().getFullYear() - 5;
      const result = estimateAverageForSimilar(year);
      expect(result.description).toContain(`${year} vehicles`);
    });
  });
});
