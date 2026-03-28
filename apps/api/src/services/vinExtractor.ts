// apps/api/src/services/vinExtractor.ts

// Standard 17-char VIN — excludes I, O, Q per ISO 3779
const VIN_RE = /\b([A-HJ-NPR-Z0-9]{17})\b/i;

/**
 * Extracts the first valid 17-character VIN from raw OCR or COR text.
 * Returns the VIN uppercased, or null if not found.
 */
function extract(text: string): string | null {
  if (!text) return null;
  const m = text.match(VIN_RE);
  if (!m?.[1]) return null;
  return m[1].toUpperCase();
}

export const vinExtractor = { extract };
