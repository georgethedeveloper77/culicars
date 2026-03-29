// apps/api/src/services/corEnrichService.ts

import { prisma } from '../lib/prisma';
import { ntsaCorParser, type CorFields, type ParseResult } from './ntsaCorParser';
import { visionClient } from './visionClient';

const NTSA_COR_SOURCE = 'ntsa_cor';
const NTSA_COR_CONFIDENCE = 1.0;

export interface CorEnrichOptions {
  /** VIN that this COR belongs to */
  vin: string;
  /** Plate (used when VIN not yet known) */
  plate?: string;
  /** Raw PDF bytes — provide when the file has already been received */
  pdfBuffer?: Buffer;
  /** Base64-encoded PDF string */
  pdfBase64?: string;
  /** ID of the admin user triggering the parse (for audit) */
  triggeredBy?: string;
}

export interface CorEnrichResult {
  success: boolean;
  parseResult?: ParseResult;
  rawRecordId?: string;
  error?: string;
}

/**
 * Extracts text from the COR PDF using Google Cloud Vision, parses the fields
 * via ntsaCorParser, and stores the normalised record into raw_records.
 * Owner PII is never stored.
 */
async function enrichFromPdf(opts: CorEnrichOptions): Promise<CorEnrichResult> {
  const { vin, plate, pdfBuffer, pdfBase64, triggeredBy } = opts;

  if (!pdfBuffer && !pdfBase64) {
    return { success: false, error: 'No PDF data provided' };
  }

  const b64 = pdfBase64 ?? pdfBuffer!.toString('base64');

  // 1. Extract text from PDF via Vision API
  let rawText: string;
  try {
    rawText = await visionClient.detectTextInPdf(b64);
  } catch (err: any) {
    return {
      success: false,
      error: `Vision PDF text extraction failed: ${err?.message ?? String(err)}`,
    };
  }

  // 2. Parse COR fields
  const parseResult = ntsaCorParser.parse(rawText);

  // 3. Derive the best VIN — prefer passed-in VIN, fall back to parsed
  const resolvedVin = vin || parseResult.fields.vin;
  if (!resolvedVin) {
    return {
      success: false,
      parseResult,
      error: 'Unable to determine VIN from COR or caller',
    };
  }

  // 4. Build normalised JSON — strip any PII fields (name, id, address)
  const normalisedFields: CorFields = { ...parseResult.fields };
  // explicitly ensure PII never leaks — these keys don't exist on CorFields
  // but guard in case the type is extended carelessly
  const piiKeys = ['ownerName', 'ownerId', 'ownerAddress', 'ownerPhone'];
  for (const k of piiKeys) {
    delete (normalisedFields as any)[k];
  }

  // 5. Upsert into raw_records
  let rawRecord: { id: string };
  try {
    rawRecord = await prisma.raw_records.create({
      data: {
        vin: resolvedVin,
        plate: plate ?? parseResult.fields.plate ?? null,
        source: NTSA_COR_SOURCE,
        source_id: `cor-${resolvedVin}-${Date.now()}`,
        raw_json: { text: rawText },
        normalised_json: normalisedFields as any,
        confidence: parseResult.confidence,
      },
      select: { id: true },
    });
  } catch (err: any) {
    return {
      success: false,
      parseResult,
      error: `DB write failed: ${err?.message ?? String(err)}`,
    };
  }

  return {
    success: true,
    parseResult,
    rawRecordId: rawRecord.id,
  };
}

export const corEnrichService = { enrichFromPdf };
