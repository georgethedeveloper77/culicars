// ============================================================
// CuliCars — Thread 4: Plate Extractor
// ============================================================
// Extracts Kenya-format number plates from raw OCR text.
// Supports all 6 formats: KXX 000X, KXX 000, GK, GN, CD, UN

import { normalizePlate } from '@culicars/utils';
import type { ExtractedPlate } from '../types/ocr.types';

/**
 * Kenya plate regex patterns ordered by specificity.
 * Each pattern includes a base confidence for that format.
 */
const PLATE_PATTERNS: Array<{ regex: RegExp; baseConfidence: number }> = [
  // KXX 000X — post-2004 standard (most common)
  { regex: /\b(K[A-Z]{2})\s*(\d{3})\s*([A-Z])\b/gi, baseConfidence: 0.9 },

  // KXX 000 — older private vehicles
  { regex: /\b(K[A-Z]{2})\s*(\d{3})(?![A-Z\d])\b/gi, baseConfidence: 0.85 },

  // GK XXXX — Government of Kenya
  { regex: /\b(GK)\s*(\d{3,4})\s*([A-Z])?\b/gi, baseConfidence: 0.85 },

  // GN XXXX — Military
  { regex: /\b(GN)\s*(\d{3,4})\s*([A-Z])?\b/gi, baseConfidence: 0.8 },

  // CD XXX — Diplomatic Corps
  { regex: /\b(CD)\s*(\d{2,3})\s*([A-Z])?\b/gi, baseConfidence: 0.8 },

  // UN XXXX — United Nations
  { regex: /\b(UN)\s*(\d{3,4})\s*([A-Z])?\b/gi, baseConfidence: 0.8 },
];

/**
 * Extract all Kenya-format plates from OCR text.
 * Returns sorted by confidence (highest first).
 */
export function extractPlates(ocrText: string): ExtractedPlate[] {
  if (!ocrText || !ocrText.trim()) return [];

  const results: ExtractedPlate[] = [];
  const seen = new Set<string>();

  // Clean up common OCR artifacts
  const cleanedText = cleanOcrText(ocrText);

  for (const { regex, baseConfidence } of PLATE_PATTERNS) {
    // Reset regex lastIndex for global patterns
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(cleanedText)) !== null) {
      const raw = match[0].trim();
      const result = normalizePlate(raw);
const normalized = typeof result === 'string' ? result : result?.normalized || '';

      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);

      // Adjust confidence based on context clues
      const confidence = adjustPlateConfidence(
        baseConfidence,
        raw,
        cleanedText,
        match.index
      );

      results.push({
        value: normalized,
        display: formatPlateDisplay(normalized),
        confidence,
        raw,
      });
    }
  }

  // Sort highest confidence first
  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Adjust plate confidence based on surrounding OCR context.
 */
function adjustPlateConfidence(
  base: number,
  raw: string,
  fullText: string,
  matchIndex: number
): number {
  let confidence = base;

  // Boost: plate appears near keywords like "Reg", "Registration", "Number Plate"
  const surroundingText = fullText
    .slice(Math.max(0, matchIndex - 80), matchIndex + raw.length + 80)
    .toLowerCase();

  const boostKeywords = [
    'registration',
    'reg no',
    'reg. no',
    'number plate',
    'plate no',
    'vehicle no',
    'motor vehicle',
  ];
  if (boostKeywords.some((kw) => surroundingText.includes(kw))) {
    confidence = Math.min(confidence + 0.08, 1.0);
  }

  // Penalize: very short raw text (may be partial match)
  if (raw.replace(/\s/g, '').length < 5) {
    confidence -= 0.1;
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Format a normalized plate for display: KCA123A → KCA 123A
 */
function formatPlateDisplay(normalized: string): string {
  // KXX 000X or KXX 000
  const kMatch = normalized.match(/^(K[A-Z]{2})(\d{3})([A-Z]?)$/);
  if (kMatch) {
    return `${kMatch[1]} ${kMatch[2]}${kMatch[3]}`.trim();
  }

  // GK/GN/CD/UN patterns
  const govMatch = normalized.match(/^(GK|GN|CD|UN)(\d+)([A-Z]?)$/);
  if (govMatch) {
    return `${govMatch[1]} ${govMatch[2]}${govMatch[3]}`.trim();
  }

  return normalized;
}

/**
 * Clean common OCR noise from text before plate extraction.
 */
function cleanOcrText(text: string): string {
  return text
    // Common OCR substitutions
    .replace(/[|l]/g, (ch, idx, str) => {
      // Only replace if it looks like it's in a plate context
      const around = str.slice(Math.max(0, idx - 3), idx + 4);
      return /[A-Z]\d/.test(around) ? 'I' : ch;
    })
    // Remove excessive whitespace but keep single spaces
    .replace(/\s+/g, ' ')
    .trim();
}
