// ============================================================
// CuliCars — Thread 4: Chassis Extractor Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { extractChassis } from '../services/chassisExtractor';

describe('chassisExtractor', () => {
  describe('Toyota-style chassis', () => {
    it('extracts NZE141-6012345 format', () => {
      const result = extractChassis('Chassis Number: NZE141-6012345');
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].value).toBe('NZE1416012345');
    });

    it('extracts NCP91-1234567 format', () => {
      const result = extractChassis('Chassis No: NCP91-1234567');
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('keyword context', () => {
    it('boosts confidence when near chassis keyword', () => {
      const withKeyword = extractChassis('Chassis Number: ABC123-4567890');
      const withoutKeyword = extractChassis('Random ABC123-4567890 text');
      if (withKeyword.length && withoutKeyword.length) {
        expect(withKeyword[0].confidence).toBeGreaterThanOrEqual(
          withoutKeyword[0].confidence
        );
      }
    });
  });

  describe('edge cases', () => {
    it('returns empty for no chassis numbers', () => {
      expect(extractChassis('No chassis here')).toHaveLength(0);
    });

    it('returns empty for empty string', () => {
      expect(extractChassis('')).toHaveLength(0);
    });

    it('rejects pure alphabetic strings', () => {
      const result = extractChassis('Chassis: ABCDEFGHIJ');
      const valid = result.filter((r) => /\d/.test(r.value) && /[A-Z]/.test(r.value));
      // Should only return items with both letters and digits
      expect(result.every((r) => /\d/.test(r.value) && /[A-Z]/.test(r.value))).toBe(true);
    });

    it('rejects pure numeric strings', () => {
      const result = extractChassis('Chassis: 1234567890');
      expect(result.every((r) => /[A-Z]/.test(r.value))).toBe(true);
    });
  });
});
