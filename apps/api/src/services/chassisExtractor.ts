// apps/api/src/services/chassisExtractor.ts

const CHASSIS_RE = /(?:chassis|frame)\s*(?:no|number|#)?\s*[:\s]+([A-HJ-NPR-Z0-9]{4,20})/i;

/**
 * Extracts the chassis / frame number from COR text.
 * Returns null if no match found.
 */
function extract(text: string): string | null {
  const m = text.match(CHASSIS_RE);
  if (!m?.[1]) return null;
  return m[1].toUpperCase().trim();
}

export const chassisExtractor = { extract };
