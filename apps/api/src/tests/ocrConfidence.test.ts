// ============================================================
// CuliCars — Thread 4: OCR Confidence Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { calculateOverallConfidence, confidenceLevel } from '../services/ocrConfidence';
import type { OcrExtractionResult, VisionResponse } from '../types/ocr.types';

function makeVision(confidence: number): VisionResponse {
  return { fullText: 'test', blocks: [], confidence };
}

function makeExtraction(overrides: Partial<OcrExtractionResult> = {}): OcrExtractionResult {
  return {
    plates: [],
    vins: [],
    chassis: [],
    bestPlate: null,
    bestVin: null,
    bestChassis: null,
    overallConfidence: 0,
    ...overrides,
  };
}

describe('ocrConfidence', () => {
  describe('calculateOverallConfidence', () => {
    it('returns near 0 when nothing extracted', () => {
      const score = calculateOverallConfidence(
        makeVision(0.9),
        makeExtraction()
      );
      // Vision confidence * 0.25 * 0.2 (penalty) = very low
      expect(score).toBeLessThan(0.1);
    });

    it('returns high score when plate + VIN + chassis all found', () => {
      const score = calculateOverallConfidence(
        makeVision(0.95),
        makeExtraction({
          bestPlate: { value: 'KCA123A', display: 'KCA 123A', confidence: 0.9, raw: 'KCA 123A' },
          bestVin: { value: 'JTDBR32E540012345', confidence: 0.9, raw: 'JTDBR32E540012345', isValid: true },
          bestChassis: { value: 'JTDBR32E540012345', confidence: 0.85, raw: 'JTDBR32E540012345' },
        })
      );
      expect(score).toBeGreaterThan(0.8);
    });

    it('gives cross-validation bonus when VIN matches chassis', () => {
      const withMatch = calculateOverallConfidence(
        makeVision(0.9),
        makeExtraction({
          bestVin: { value: 'JTDBR32E540012345', confidence: 0.85, raw: '', isValid: true },
          bestChassis: { value: 'JTDBR32E540012345', confidence: 0.8, raw: '' },
        })
      );
      const withoutMatch = calculateOverallConfidence(
        makeVision(0.9),
        makeExtraction({
          bestVin: { value: 'JTDBR32E540012345', confidence: 0.85, raw: '', isValid: true },
          bestChassis: { value: 'COMPLETELY000DIFF', confidence: 0.8, raw: '' },
        })
      );
      expect(withMatch).toBeGreaterThan(withoutMatch);
    });

    it('plate-only gives moderate score', () => {
      const score = calculateOverallConfidence(
        makeVision(0.9),
        makeExtraction({
          bestPlate: { value: 'KCA123A', display: 'KCA 123A', confidence: 0.9, raw: 'KCA 123A' },
        })
      );
      expect(score).toBeGreaterThan(0.3);
      expect(score).toBeLessThan(0.7);
    });
  });

  describe('confidenceLevel', () => {
    it('returns high for 0.8+', () => {
      expect(confidenceLevel(0.85)).toBe('high');
      expect(confidenceLevel(1.0)).toBe('high');
    });

    it('returns medium for 0.5-0.79', () => {
      expect(confidenceLevel(0.5)).toBe('medium');
      expect(confidenceLevel(0.79)).toBe('medium');
    });

    it('returns low for 0.01-0.49', () => {
      expect(confidenceLevel(0.1)).toBe('low');
      expect(confidenceLevel(0.49)).toBe('low');
    });

    it('returns none for 0', () => {
      expect(confidenceLevel(0)).toBe('none');
    });
  });
});
