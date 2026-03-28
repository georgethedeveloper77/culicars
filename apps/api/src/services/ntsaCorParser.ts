// apps/api/src/services/ntsaCorParser.ts

/**
 * Parses text extracted from an NTSA Certificate of Registration (COR) PDF.
 *
 * Owner PII (name, ID number, physical address) is intentionally discarded
 * per product rules — it is NEVER stored or returned.
 *
 * Fields captured:
 *   chassis / VIN, engine number, registration number (plate),
 *   make, model, year, colour, body type, fuel type,
 *   registration date, expiry date, tare, gross weight
 */

export interface CorFields {
  plate?: string;
  vin?: string;
  engineNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  colour?: string;
  bodyType?: string;
  fuelType?: string;
  registrationDate?: string; // ISO date string
  expiryDate?: string;       // ISO date string
  tare?: number;             // kg
  grossWeight?: number;      // kg
  // owner PII fields are deliberately absent
}

export interface ParseResult {
  success: boolean;
  fields: CorFields;
  confidence: number; // 0–1
  rawText: string;
  warnings: string[];
}

// ─── helpers ────────────────────────────────────────────────────────────────

function first(text: string, ...patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

function parseDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // handle DD/MM/YYYY and DD-MM-YYYY
  const m = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!m) return undefined;
  const [, d, mo, yr] = m;
  return `${yr}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function parseYear(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const y = parseInt(raw, 10);
  return y >= 1950 && y <= new Date().getFullYear() + 1 ? y : undefined;
}

function parseKg(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = parseFloat(raw.replace(/,/g, ''));
  return isNaN(n) ? undefined : n;
}

// Kenyan plate format: KXX 000X  or KXX 000
const PLATE_RE = /\b(K[A-Z]{2}\s?\d{3}[A-Z]?)\b/i;

// Standard 17-char VIN
const VIN_RE = /\b([A-HJ-NPR-Z0-9]{17})\b/i;

// ─── main export ────────────────────────────────────────────────────────────

function parse(rawText: string): ParseResult {
  const text = rawText.replace(/\r/g, '\n');
  const warnings: string[] = [];
  const fields: CorFields = {};

  // plate
  const plateCandidates = text.match(new RegExp(PLATE_RE.source, 'gi')) ?? [];
  if (plateCandidates.length > 0) {
    // pick the most-repeated candidate (appears in multiple sections of COR)
    const freq: Record<string, number> = {};
    for (const c of plateCandidates) {
      const k = c.toUpperCase().replace(/\s/g, '');
      freq[k] = (freq[k] ?? 0) + 1;
    }
    const best = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    if (best) fields.plate = best[0];
  } else {
    warnings.push('plate not found');
  }

  // VIN / chassis
  fields.vin = first(
    text,
    /chassis\s*(?:no|number|#)?[:\s]+([A-HJ-NPR-Z0-9]{17})/i,
    /vin[:\s]+([A-HJ-NPR-Z0-9]{17})/i,
    /frame\s*no[:\s]+([A-HJ-NPR-Z0-9]{17})/i,
  );
  if (!fields.vin) {
    // fallback: any 17-char sequence in the text
    const m = text.match(VIN_RE);
    if (m) fields.vin = m[1].toUpperCase();
    else warnings.push('VIN not found');
  }

  // engine number
  fields.engineNumber = first(
    text,
    /engine\s*(?:no|number|#)?[:\s]+([A-Z0-9\-]{4,20})/i,
  );
  if (!fields.engineNumber) warnings.push('engine number not found');

  // make
  fields.make = first(
    text,
    /make\s*[:\s]+([A-Za-z]+)/i,
    /manufacturer\s*[:\s]+([A-Za-z]+)/i,
  );

  // model
  fields.model = first(text, /model\s*[:\s]+([A-Za-z0-9\s\-]+?)(?:\n|$)/i);

  // year of manufacture
  const yearRaw = first(
    text,
    /year\s*of\s*manufacture\s*[:\s]+(\d{4})/i,
    /year\s*[:\s]+(\d{4})/i,
  );
  fields.year = parseYear(yearRaw);
  if (!fields.year) warnings.push('year not found');

  // colour
  fields.colour = first(text, /colou?r\s*[:\s]+([A-Za-z\s\/]+?)(?:\n|$)/i);

  // body type
  fields.bodyType = first(
    text,
    /body\s*type\s*[:\s]+([A-Za-z\s]+?)(?:\n|$)/i,
    /body\s*[:\s]+([A-Za-z\s]+?)(?:\n|$)/i,
  );

  // fuel type
  fields.fuelType = first(
    text,
    /fuel\s*type\s*[:\s]+([A-Za-z]+)/i,
    /fuel\s*[:\s]+([A-Za-z]+)/i,
  );

  // registration date
  const regDateRaw = first(
    text,
    /date\s*of\s*(?:first\s*)?registration\s*[:\s]+([\d\/\-]+)/i,
    /registration\s*date\s*[:\s]+([\d\/\-]+)/i,
  );
  fields.registrationDate = parseDate(regDateRaw);

  // expiry
  const expiryRaw = first(
    text,
    /expiry\s*date\s*[:\s]+([\d\/\-]+)/i,
    /valid\s*(?:until|to)\s*[:\s]+([\d\/\-]+)/i,
  );
  fields.expiryDate = parseDate(expiryRaw);

  // tare / gross weight
  const tareRaw = first(text, /tare\s*(?:weight)?\s*[:\s]+([\d,\.]+)/i);
  fields.tare = parseKg(tareRaw);

  const grossRaw = first(
    text,
    /gross\s*(?:vehicle\s*)?weight\s*[:\s]+([\d,\.]+)/i,
    /g\.?v\.?w\.?\s*[:\s]+([\d,\.]+)/i,
  );
  fields.grossWeight = parseKg(grossRaw);

  // confidence: ratio of key fields found
  const keyFields: Array<keyof CorFields> = [
    'plate', 'vin', 'make', 'model', 'year', 'registrationDate',
  ];
  const found = keyFields.filter((k) => fields[k] !== undefined).length;
  const confidence = parseFloat((found / keyFields.length).toFixed(2));

  return {
    success: confidence > 0,
    fields,
    confidence,
    rawText,
    warnings,
  };
}

export const ntsaCorParser = { parse };
