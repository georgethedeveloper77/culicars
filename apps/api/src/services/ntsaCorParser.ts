// ============================================================
// CuliCars — Thread 4: NTSA COR Parser
// ============================================================
// Parses NTSA Certificate of Registration (COR) PDF text.
// CRITICAL: Owner name, ID number, address are DISCARDED — never stored.
// Extracts: plate, VIN/chassis, make, model, inspection, caveat, transfers.

import { normalizePlate } from '@culicars/utils';
import type { NtsaCorRawFields, NtsaCorParsed } from '../types/ocr.types';

/**
 * Parse OCR text from an NTSA COR PDF.
 * Returns structured COR data with owner info stripped.
 */
export function parseCorText(ocrText: string): NtsaCorParsed {
  const raw = extractRawFields(ocrText);
  return sanitizeAndNormalize(raw);
}

/**
 * Extract raw key-value fields from COR OCR text.
 * COR PDFs typically have a label: value format.
 */
function extractRawFields(text: string): NtsaCorRawFields {
  const lines = text.split('\n').map((l) => l.trim());
  const fullText = text;

  return {
    registrationNumber: findField(lines, fullText, [
      'registration number',
      'registration no',
      'reg no',
      'reg. no',
      'number plate',
      'plate no',
    ]),

    chassisNumber: findField(lines, fullText, [
      'chassis number',
      'chassis no',
      'chassis/vin',
      'vin no',
      'vin number',
      'frame no',
      'frame number',
    ]),

    make: findField(lines, fullText, ['make', 'manufacturer']),

    model: findField(lines, fullText, ['model', 'type/model']),

    bodyType: findField(lines, fullText, [
      'body type',
      'body',
      'type of body',
    ]),

    color: findField(lines, fullText, ['colo', 'colour', 'color']),

    yearOfManufacture: parseYear(
      findField(lines, fullText, [
        'year of manufacture',
        'year of mfg',
        'year',
        'manufactured',
      ])
    ),

    engineCapacity: findField(lines, fullText, [
      'engine capacity',
      'engine cc',
      'cc rating',
      'cubic capacity',
    ]),

    fuelType: findField(lines, fullText, [
      'fuel type',
      'fuel',
      'type of fuel',
    ]),

    registrationDate: findField(lines, fullText, [
      'date of registration',
      'registration date',
      'date registered',
      'first registration',
    ]),

    inspectionStatus: findField(lines, fullText, [
      'inspection status',
      'inspection',
      'inspection result',
      'mot status',
    ]),

    inspectionDate: findField(lines, fullText, [
      'inspection date',
      'date of inspection',
      'last inspection',
    ]),

    caveatStatus: findField(lines, fullText, [
      'caveat',
      'caveat status',
      'encumbrance',
      'court order',
    ]),

    logbookNumber: findField(lines, fullText, [
      'logbook number',
      'logbook no',
      'log book',
    ]),

    numberOfTransfers: parseTransferCount(
      findField(lines, fullText, [
        'number of transfers',
        'transfer count',
        'no. of transfers',
        'ownership changes',
      ])
    ),

    lastTransferDate: findField(lines, fullText, [
      'last transfer date',
      'date of last transfer',
      'latest transfer',
    ]),

    // ⚠️ THESE ARE EXTRACTED BUT IMMEDIATELY DISCARDED:
    // ownerName, ownerIdNumber, ownerAddress — NOT in returned object
  };
}

/**
 * Find a field value by searching for label keywords.
 * Handles both "Label: Value" on same line and "Label\nValue" patterns.
 */
function findField(
  lines: string[],
  fullText: string,
  keywords: string[]
): string | null {
  const lowerLines = lines.map((l) => l.toLowerCase());

  for (const keyword of keywords) {
    const kw = keyword.toLowerCase();

    for (let i = 0; i < lowerLines.length; i++) {
      const line = lowerLines[i];

      // Pattern 1: "Label: Value" or "Label  Value" on same line
      if (line.includes(kw)) {
        // Try colon separator
        const colonIdx = lines[i].indexOf(':');
        if (colonIdx > -1) {
          const value = lines[i].slice(colonIdx + 1).trim();
          if (value) return value;
        }

        // Try tab separator
        const tabIdx = lines[i].indexOf('\t');
        if (tabIdx > -1) {
          const value = lines[i].slice(tabIdx + 1).trim();
          if (value) return value;
        }

        // Pattern 2: Value on next non-empty line
        for (let j = i + 1; j < lines.length && j <= i + 2; j++) {
          if (lines[j].trim() && !isLabelLine(lowerLines[j])) {
            return lines[j].trim();
          }
        }
      }
    }
  }

  return null;
}

/**
 * Check if a line looks like a label (ends with :, or is all caps + short).
 */
function isLabelLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.endsWith(':')) return true;
  if (trimmed.length < 30 && trimmed === trimmed.toUpperCase()) return true;
  return false;
}

/**
 * Sanitize raw fields and normalize to typed COR result.
 * Owner info is already excluded from NtsaCorRawFields.
 */
function sanitizeAndNormalize(raw: NtsaCorRawFields): NtsaCorParsed {
  const rawResult = raw.registrationNumber
  ? normalizePlate(raw.registrationNumber)
  : null;
const plate = rawResult
  ? (typeof rawResult === 'string' ? rawResult : rawResult?.normalized || '')
  : '';

  return {
    plate,
    plateDisplay: formatPlateDisplay(plate),
    vin: cleanChassis(raw.chassisNumber),
    make: cleanText(raw.make),
    model: cleanText(raw.model),
    bodyType: cleanText(raw.bodyType),
    color: cleanText(raw.color),
    yearOfManufacture: raw.yearOfManufacture,
    engineCapacity: parseEngineCC(raw.engineCapacity),
    fuelType: cleanText(raw.fuelType),
    registrationDate: parseDate(raw.registrationDate),
    inspectionStatus: normalizeInspectionStatus(raw.inspectionStatus),
    inspectionDate: parseDate(raw.inspectionDate),
    caveatStatus: normalizeCaveatStatus(raw.caveatStatus),
    logbookNumber: cleanText(raw.logbookNumber),
    numberOfTransfers: raw.numberOfTransfers,
    lastTransferDate: parseDate(raw.lastTransferDate),
  };
}

// ---- Helpers ----

function cleanText(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned || null;
}

function cleanChassis(value: string | null): string {
  if (!value) return '';
  return value.replace(/[\s-]/g, '').toUpperCase();
}

function parseYear(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : null;
}

function parseEngineCC(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/(\d{3,5})/);
  return match ? parseInt(match[1], 10) : null;
}

function parseTransferCount(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;

  // Try common formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const patterns = [
    /(\d{2})[/\-.](\d{2})[/\-.](\d{4})/,  // DD/MM/YYYY
    /(\d{4})[/\-.](\d{2})[/\-.](\d{2})/,  // YYYY-MM-DD
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) {
      let year: number, month: number, day: number;

      if (match[1].length === 4) {
        // YYYY-MM-DD
        year = parseInt(match[1]);
        month = parseInt(match[2]);
        day = parseInt(match[3]);
      } else {
        // DD/MM/YYYY (Kenya format)
        day = parseInt(match[1]);
        month = parseInt(match[2]);
        year = parseInt(match[3]);
      }

      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
  }

  return null;
}

function normalizeInspectionStatus(
  value: string | null
): 'passed' | 'failed' | 'expired' | 'unknown' {
  if (!value) return 'unknown';
  const lower = value.toLowerCase();
  if (lower.includes('pass') || lower.includes('valid')) return 'passed';
  if (lower.includes('fail')) return 'failed';
  if (lower.includes('expir')) return 'expired';
  return 'unknown';
}

function normalizeCaveatStatus(
  value: string | null
): 'clear' | 'caveat' | 'unknown' {
  if (!value) return 'unknown';
  const lower = value.toLowerCase();
  if (lower.includes('clear') || lower.includes('none') || lower.includes('no caveat')) {
    return 'clear';
  }
  if (lower.includes('caveat') || lower.includes('encumbrance') || lower.includes('order')) {
    return 'caveat';
  }
  return 'unknown';
}

function formatPlateDisplay(normalized: string): string {
  if (!normalized) return '';
  const kMatch = normalized.match(/^(K[A-Z]{2})(\d{3})([A-Z]?)$/);
  if (kMatch) return `${kMatch[1]} ${kMatch[2]}${kMatch[3]}`.trim();

  const govMatch = normalized.match(/^(GK|GN|CD|UN)(\d+)([A-Z]?)$/);
  if (govMatch) return `${govMatch[1]} ${govMatch[2]}${govMatch[3]}`.trim();

  return normalized;
}
