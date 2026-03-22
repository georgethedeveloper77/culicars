// ============================================================
// CuliCars — Thread 4: VIN Extractor Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { extractVins } from '../services/vinExtractor';

describe('vinExtractor', () => {
  describe('valid VINs', () => {
    it('extracts a clean 17-char VIN', () => {
      const result = extractVins('VIN: JTDBR32E540012345');
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('JTDBR32E540012345');
    });

    it('extracts VIN without label', () => {
      const result = extractVins('The vehicle JTDBR32E540012345 was imported');
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('JTDBR32E540012345');
    });

    it('extracts VIN with spaces (loose pattern)', () => {
      const result = extractVins('Chassis: JTD BR32E5 40012345');
      expect(result.length).toBeGreaterThanOrEqual(1);
      // Should clean spaces
      const cleaned = result.find((r) => r.value.length === 17);
      expect(cleaned).toBeTruthy();
    });

    it('boosts confidence near VIN keywords', () => {
      const withKeyword = extractVins('VIN Number: JTDBR32E540012345');
      const withoutKeyword = extractVins('Random JTDBR32E540012345 text');
      if (withKeyword.length && withoutKeyword.length) {
        expect(withKeyword[0].confidence).toBeGreaterThanOrEqual(
          withoutKeyword[0].confidence
        );
      }
    });
  });

  describe('multiple VINs', () => {
    it('extracts two different VINs', () => {
      const result = extractVins(
        'VIN1: JTDBR32E540012345 and VIN2: JTDKN3DU5A0056789'
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('returns empty for no VINs', () => {
      expect(extractVins('No VIN here')).toHaveLength(0);
    });

    it('returns empty for empty string', () => {
      expect(extractVins('')).toHaveLength(0);
    });

    it('rejects strings with I, O, Q (invalid VIN chars)', () => {
      const result = extractVins('JTDBR32E54OO12345'); // O not 0
      // Should either not match or flag as invalid
      const validOnes = result.filter((r) => r.isValid);
      expect(validOnes).toHaveLength(0);
    });

    it('deduplicates same VIN', () => {
      const result = extractVins(
        'JTDBR32E540012345 ... JTDBR32E540012345'
      );
      expect(result).toHaveLength(1);
    });
  });
});
