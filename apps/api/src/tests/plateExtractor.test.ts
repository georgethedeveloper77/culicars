// ============================================================
// CuliCars — Thread 4: Plate Extractor Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { extractPlates } from '../services/plateExtractor';

describe('plateExtractor', () => {
  describe('KXX 000X format (post-2004)', () => {
    it('extracts standard plate from clean text', () => {
      const result = extractPlates('Registration Number: KCA 123A');
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('KCA123A');
      expect(result[0].display).toBe('KCA 123A');
    });

    it('extracts plate without spaces', () => {
      const result = extractPlates('Vehicle: KCA123A registered');
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('KCA123A');
    });

    it('extracts plate with extra spaces', () => {
  const result = extractPlates('Plate: KCA  123  A');
  expect(result.length).toBeGreaterThanOrEqual(1);
  expect(result[0].value).toBe('KCA123A');
});

    it('extracts multiple plates from same text', () => {
      const result = extractPlates('KCA 123A was sold. New plate KDG 456B.');
      expect(result).toHaveLength(2);
      const values = result.map((r) => r.value);
      expect(values).toContain('KCA123A');
      expect(values).toContain('KDG456B');
    });

    it('boosts confidence when near registration keywords', () => {
      const withKeyword = extractPlates('Registration Number: KCA 123A');
      const withoutKeyword = extractPlates('text KCA 123A more text');
      expect(withKeyword[0].confidence).toBeGreaterThan(withoutKeyword[0].confidence);
    });
  });

  describe('KXX 000 format (older)', () => {
    it('extracts older format plate', () => {
      const result = extractPlates('Reg: KAA 123');
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('KAA123');
    });
  });

  describe('Government plates', () => {
    it('extracts GK plate', () => {
      const result = extractPlates('GK 1234A');
      expect(result).toHaveLength(1);
      expect(result[0].value).toMatch(/^GK/);
    });

    it('extracts CD plate', () => {
      const result = extractPlates('CD 123');
      expect(result).toHaveLength(1);
      expect(result[0].value).toMatch(/^CD/);
    });

    it('extracts UN plate', () => {
      const result = extractPlates('UN 4567');
      expect(result).toHaveLength(1);
      expect(result[0].value).toMatch(/^UN/);
    });
  });

  describe('edge cases', () => {
    it('returns empty for no plates', () => {
      expect(extractPlates('No plate here')).toHaveLength(0);
    });

    it('returns empty for empty string', () => {
      expect(extractPlates('')).toHaveLength(0);
    });

    it('deduplicates same plate', () => {
      const result = extractPlates('KCA 123A ... KCA123A');
      expect(result).toHaveLength(1);
    });

    it('handles noisy OCR text', () => {
      const result = extractPlates('REG. NO.  KCA  123A\n  TOYOTA FIELDER');
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].value).toBe('KCA123A');
    });
  });
});
