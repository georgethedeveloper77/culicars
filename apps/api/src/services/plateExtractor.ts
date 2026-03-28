// apps/api/src/services/plateExtractor.ts

// Standard Kenyan plate: K + 2 letters + space? + 3 digits + optional letter
// e.g. KCA 001A, KDB 456, KXX999Z
const PLATE_RE = /\b(K[A-Z]{2}\s?\d{3}[A-Z]?)\b/i;

/**
 * Extracts the first valid Kenyan number plate from raw OCR text.
 * Returns the plate normalised to uppercase with no spaces, or null.
 */
function extract(text: string): string | null {
  if (!text) return null;
  const m = text.match(PLATE_RE);
  if (!m?.[1]) return null;
  return m[1].toUpperCase().replace(/\s+/g, '');
}

export const plateExtractor = { extract };
