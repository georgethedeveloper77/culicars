// apps/api/src/tests/vinExtractor.test.ts

import { describe, it, expect } from 'vitest';
import { vinExtractor } from '../services/vinExtractor';

describe('vinExtractor', () => {
  describe('extract()', () => {
    it('extracts a valid 17-char VIN', () => {
      expect(vinExtractor.extract('JTMHE3FJ90K012345')).toBe('JTMHE3FJ90K012345');
    });

    it('extracts VIN embedded in text', () => {
      const text = 'Chassis No: JTMHE3FJ90K012345\nMake: Toyota';
      expect(vinExtractor.extract(text)).toBe('JTMHE3FJ90K012345');
    });

    it('uppercases extracted VIN', () => {
      expect(vinExtractor.extract('jtmhe3fj90k012345')).toBe('JTMHE3FJ90K012345');
    });

    it('returns null for 16-char string', () => {
      expect(vinExtractor.extract('JTMHE3FJ90K01234')).toBeNull();
    });

    it('returns null for 18-char string', () => {
      expect(vinExtractor.extract('JTMHE3FJ90K0123456')).toBeNull();
    });

    it('rejects VINs with forbidden chars I, O, Q', () => {
      expect(vinExtractor.extract('JTMHE3FI90K012345')).toBeNull();
      expect(vinExtractor.extract('JTMHE3FO90K012345')).toBeNull();
      expect(vinExtractor.extract('JTMHE3FQ90K012345')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(vinExtractor.extract('')).toBeNull();
    });

    it('returns null for plain text with no VIN', () => {
      expect(vinExtractor.extract('No VIN in this text at all.')).toBeNull();
    });
  });
});
