// ============================================================
// CuliCars — Thread 4: OCR Confidence Scorer
// ============================================================
// Calculates overall OCR confidence from individual extractions.
// Factors: Vision API confidence, extraction match quality,
// cross-validation between plate/VIN/chassis.

import type { OcrExtractionResult } from '../types/ocr.types';
import type { VisionResponse } from '../types/ocr.types';

interface ConfidenceFactors {
  visionConfidence: number;     // raw Vision API confidence
  bestPlateConfidence: number;  // best plate extraction
  bestVinConfidence: number;    // best VIN extraction
  bestChassisConfidence: number;
  hasPlate: boolean;
  hasVin: boolean;
  hasChassis: boolean;
  crossValidated: boolean;      // VIN found in both extraction + chassis
}

/**
 * Calculate the overall confidence score for an OCR scan.
 * Returns a value between 0.0 and 1.0.
 */
export function calculateOverallConfidence(
  vision: VisionResponse,
  extraction: OcrExtractionResult
): number {
  const factors: ConfidenceFactors = {
    visionConfidence: vision.confidence,
    bestPlateConfidence: extraction.bestPlate?.confidence ?? 0,
    bestVinConfidence: extraction.bestVin?.confidence ?? 0,
    bestChassisConfidence: extraction.bestChassis?.confidence ?? 0,
    hasPlate: extraction.bestPlate !== null,
    hasVin: extraction.bestVin !== null,
    hasChassis: extraction.bestChassis !== null,
    crossValidated: checkCrossValidation(extraction),
  };

  return computeScore(factors);
}

/**
 * Check if VIN and chassis number cross-validate each other.
 * A VIN that matches or contains the chassis number is high confidence.
 */
function checkCrossValidation(extraction: OcrExtractionResult): boolean {
  if (!extraction.bestVin || !extraction.bestChassis) return false;

  const vin = extraction.bestVin.value;
  const chassis = extraction.bestChassis.value;

  // Exact match
  if (vin === chassis) return true;

  // VIN contains chassis (chassis is often a truncated VIN)
  if (vin.includes(chassis) || chassis.includes(vin)) return true;

  // Last 8 chars match (VIS portion)
  if (vin.length >= 8 && chassis.length >= 8) {
    if (vin.slice(-8) === chassis.slice(-8)) return true;
  }

  return false;
}

/**
 * Compute weighted confidence score from factors.
 */
function computeScore(f: ConfidenceFactors): number {
  // Weights
  const weights = {
    vision: 0.25,
    plate: 0.25,
    vin: 0.30,
    chassis: 0.10,
    crossValidation: 0.10,
  };

  let score = 0;

  // Vision API confidence
  score += f.visionConfidence * weights.vision;

  // Plate confidence (0 if no plate found)
  score += f.bestPlateConfidence * weights.plate;

  // VIN confidence (0 if no VIN found)
  score += f.bestVinConfidence * weights.vin;

  // Chassis confidence
  score += f.bestChassisConfidence * weights.chassis;

  // Cross-validation bonus
  if (f.crossValidated) {
    score += 1.0 * weights.crossValidation;
  }

  // Penalty: nothing extracted at all
  if (!f.hasPlate && !f.hasVin && !f.hasChassis) {
    score *= 0.2;
  }

  // Ensure bounds
  return Math.max(0, Math.min(1, score));
}

/**
 * Determine confidence level label from score.
 */
export function confidenceLevel(
  score: number
): 'high' | 'medium' | 'low' | 'none' {
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  if (score > 0) return 'low';
  return 'none';
}
