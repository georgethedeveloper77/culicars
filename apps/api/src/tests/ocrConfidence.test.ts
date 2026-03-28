// apps/api/src/tests/ocrConfidence.test.ts

import { describe, it, expect } from 'vitest';
import { ocrConfidence } from '../services/ocrConfidence';

describe('ocrConfidence', () => {
  it('returns 0 for empty string', () => {
    expect(ocrConfidence.score('')).toBe(0);
  });

  it('returns low score for very short text', () => {
    expect(ocrConfidence.score('AB')).toBeLessThan(0.5);
  });

  it('returns high score for text containing a valid plate', () => {
    const score = ocrConfidence.score('KCA 123A\nNAIROBI');
    expect(score).toBeGreaterThan(0.5);
  });

  it('returns high score for text containing a VIN', () => {
    const score = ocrConfidence.score('JTMHE3FJ90K012345');
    expect(score).toBeGreaterThan(0.5);
  });

  it('score is between 0 and 1 inclusive', () => {
    const texts = ['', 'hello', 'KCB 456A', 'JTMHE3FJ90K012345 some garbage text here'];
    for (const t of texts) {
      const s = ocrConfidence.score(t);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(1);
    }
  });
});
