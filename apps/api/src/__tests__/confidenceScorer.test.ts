// apps/api/src/__tests__/confidenceScorer.test.ts

import { describe, it, expect } from 'vitest';
import { scoreContribution, buildFactors } from '../services/confidenceScorer.js';
import type { ConfidenceFactors } from '../types/contribution.types.js';

describe('scoreContribution', () => {
  it('returns base score for minimal GENERAL_NOTE with no extras', () => {
    const factors: ConfidenceFactors = {
      contribType: 'GENERAL_NOTE',
      hasPhotos: false,
      hasVerificationDocs: false,
      isAuthenticatedUser: false,
      dataCompleteness: 0,
    };
    expect(scoreContribution(factors)).toBe(0.3);
  });

  it('adds photo bonus', () => {
    const factors: ConfidenceFactors = {
      contribType: 'GENERAL_NOTE',
      hasPhotos: true,
      hasVerificationDocs: false,
      isAuthenticatedUser: false,
      dataCompleteness: 0,
    };
    expect(scoreContribution(factors)).toBeCloseTo(0.35, 4);
  });

  it('adds verification doc bonus', () => {
    const factors: ConfidenceFactors = {
      contribType: 'GENERAL_NOTE',
      hasPhotos: false,
      hasVerificationDocs: true,
      isAuthenticatedUser: false,
      dataCompleteness: 0,
    };
    expect(scoreContribution(factors)).toBeCloseTo(0.38, 4);
  });

  it('adds auth user bonus', () => {
    const factors: ConfidenceFactors = {
      contribType: 'GENERAL_NOTE',
      hasPhotos: false,
      hasVerificationDocs: false,
      isAuthenticatedUser: true,
      dataCompleteness: 0,
    };
    expect(scoreContribution(factors)).toBeCloseTo(0.34, 4);
  });

  it('caps score at 0.65 regardless of bonuses', () => {
    const factors: ConfidenceFactors = {
      contribType: 'IMPORT_DOCUMENT',
      hasPhotos: true,
      hasVerificationDocs: true,
      isAuthenticatedUser: true,
      dataCompleteness: 1,
    };
    const score = scoreContribution(factors);
    expect(score).toBeLessThanOrEqual(0.65);
  });

  it('SERVICE_RECORD has higher base than GENERAL_NOTE', () => {
    const service = scoreContribution({
      contribType: 'SERVICE_RECORD',
      hasPhotos: false,
      hasVerificationDocs: false,
      isAuthenticatedUser: false,
      dataCompleteness: 0,
    });
    const note = scoreContribution({
      contribType: 'GENERAL_NOTE',
      hasPhotos: false,
      hasVerificationDocs: false,
      isAuthenticatedUser: false,
      dataCompleteness: 0,
    });
    expect(service).toBeGreaterThan(note);
  });

  it('score is always below NTSA trust threshold (0.9)', () => {
    const factors: ConfidenceFactors = {
      contribType: 'IMPORT_DOCUMENT',
      hasPhotos: true,
      hasVerificationDocs: true,
      isAuthenticatedUser: true,
      dataCompleteness: 1,
    };
    expect(scoreContribution(factors)).toBeLessThan(0.9);
  });
});

describe('buildFactors', () => {
  it('calculates dataCompleteness correctly', () => {
    const factors = buildFactors({
      contribType: 'SERVICE_RECORD',
      evidence_urls: ['photo.jpg'],
      verificationDocUrls: [],
      isAuthenticatedUser: true,
      dataFields: { date: '2024-01-01', mileage: 50000, garageName: '' },
    });
    // 2 of 3 fields filled → 0.666...
    expect(factors.dataCompleteness).toBeCloseTo(0.6667, 3);
    expect(factors.hasPhotos).toBe(true);
    expect(factors.hasVerificationDocs).toBe(false);
    expect(factors.isAuthenticatedUser).toBe(true);
  });

  it('handles empty data fields gracefully', () => {
    const factors = buildFactors({
      contribType: 'PHOTO_EVIDENCE',
      evidence_urls: [],
      verificationDocUrls: [],
      isAuthenticatedUser: false,
      dataFields: {},
    });
    expect(factors.dataCompleteness).toBe(0);
  });
});
