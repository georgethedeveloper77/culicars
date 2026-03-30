// apps/api/src/services/confidenceScorer.ts

import type { ConfidenceFactors, ContribType } from '../types/contribution.types.js';

/**
 * Base confidence scores per contribution type.
 * Aligns with the source trust hierarchy (user contribution = 0.4 base).
 */
const TYPE_BASE_SCORES: Record<ContribType, number> = {
  IMPORT_DOCUMENT: 0.45,
  INSPECTION_RECORD: 0.43,
  SERVICE_RECORD: 0.42,
  OWNERSHIP_TRANSFER: 0.42,
  DAMAGE_REPORT: 0.40,
  MILEAGE_RECORD: 0.40,
  LISTING_PROOF: 0.38,
  THEFT_REPORT: 0.38,
  PHOTO_EVIDENCE: 0.36,
  GENERAL_NOTE: 0.30,
};

/**
 * Score a contribution submission.
 * Max possible score is capped at 0.65 — contributions never reach
 * the trust level of NTSA COR (1.0), KRA (0.9), or BE FORWARD (0.85).
 */
export function scoreContribution(factors: ConfidenceFactors): number {
  let score = TYPE_BASE_SCORES[factors.contribType];

  // Evidence boosts
  if (factors.hasPhotos) score += 0.05;
  if (factors.hasVerificationDocs) score += 0.08;

  // Auth user is slightly more accountable than anonymous
  if (factors.isAuthenticatedUser) score += 0.04;

  // Data completeness multiplier (0–1 fraction)
  score += factors.dataCompleteness * 0.05;

  // Hard cap — user contributions never exceed 0.65
  return Math.min(parseFloat(score.toFixed(4)), 0.65);
}

/**
 * Build ConfidenceFactors from raw submission data.
 */
export function buildFactors(params: {
  contribType: ContribType;
  evidence_urls: string[];
  verificationDocUrls: string[];
  isAuthenticatedUser: boolean;
  dataFields: Record<string, unknown>;
}): ConfidenceFactors {
  const totalFields = Object.keys(params.dataFields).length;
  const filledFields = Object.values(params.dataFields).filter(
    (v) => v !== null && v !== undefined && v !== '',
  ).length;

  return {
    contribType: params.contribType,
    hasPhotos: params.evidence_urls.length > 0,
    hasVerificationDocs: params.verificationDocUrls.length > 0,
    isAuthenticatedUser: params.isAuthenticatedUser,
    dataCompleteness: totalFields > 0 ? filledFields / totalFields : 0,
  };
}
