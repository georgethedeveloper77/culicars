// apps/api/src/tests/plateExtractor.test.ts

import { describe, it, expect } from 'vitest';
import { plateExtractor } from '../services/plateExtractor';

describe('plateExtractor', () => {
  describe('extract()', () => {
    it('extracts standard 7-char Kenya plate with trailing letter', () => {
      expect(plateExtractor.extract('KCB 123A')).toBe('KCB123A');
    });

    it('extracts 6-char Kenya plate without trailing letter', () => {
      expect(plateExtractor.extract('KDB 456')).toBe('KDB456');
    });

    it('extracts plate embedded in longer text', () => {
      const text = 'Vehicle registration plate is KCA 001A issued in Nairobi';
      expect(plateExtractor.extract(text)).toBe('KCA001A');
    });

    it('is case-insensitive', () => {
      expect(plateExtractor.extract('kca 001a')).toBe('KCA001A');
    });

    it('strips whitespace from plate', () => {
      expect(plateExtractor.extract('KCB  123 A')).toMatch(/^KCB123A?$/);
    });

    it('returns null for empty string', () => {
      expect(plateExtractor.extract('')).toBeNull();
    });

    it('returns null for text with no valid plate', () => {
      expect(plateExtractor.extract('Hello world, no plate here')).toBeNull();
    });

    it('returns null for partial plate', () => {
      expect(plateExtractor.extract('KB 12')).toBeNull();
    });

    it('handles plates with no space', () => {
      expect(plateExtractor.extract('KCB123A')).toBe('KCB123A');
    });
  });
});
