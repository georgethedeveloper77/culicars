// apps/api/src/services/ocrConfidence.ts

const PLATE_RE = /\b(K[A-Z]{2}\s?\d{3}[A-Z]?)\b/i;
const VIN_RE   = /\b([A-HJ-NPR-Z0-9]{17})\b/i;
const MIN_USEFUL_LENGTH = 6;

/**
 * Scores the quality of raw OCR output text.
 * Returns a value between 0 (useless) and 1 (very confident).
 */
function score(rawText: string): number {
  if (!rawText || rawText.trim().length < MIN_USEFUL_LENGTH) return 0;

  let points = 0;
  const maxPoints = 4;

  // 1. Has a recognisable plate
  if (PLATE_RE.test(rawText)) points++;

  // 2. Has a recognisable VIN
  if (VIN_RE.test(rawText)) points++;

  // 3. Adequate text length (> 10 chars suggests real OCR output)
  if (rawText.trim().length > 10) points++;

  // 4. Low ratio of special/garbage characters
  const garbageRatio = (rawText.match(/[^A-Za-z0-9\s\/\-\.\:\,]/g) ?? []).length / rawText.length;
  if (garbageRatio < 0.15) points++;

  return parseFloat((points / maxPoints).toFixed(2));
}

export const ocrConfidence = { score };
