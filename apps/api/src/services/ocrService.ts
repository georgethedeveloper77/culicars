// ============================================================
// CuliCars — Thread 4: OCR Service (Main Orchestrator)
// ============================================================
// Orchestrates: upload → Vision API → extract plate/VIN/chassis
// → compute confidence → persist to ocr_scans.

import prisma from '../lib/prisma';
import { detectText } from './visionClient';
import { extractPlates } from './plateExtractor';
import { extractVins } from './vinExtractor';
import { extractChassis } from './chassisExtractor';
import { calculateOverallConfidence } from './ocrConfidence';
import type {
  OcrExtractionResult,
  OcrScanResponse,
  VisionResponse,
} from '../types/ocr.types';
import type { DocType, OcrSource } from '@culicars/database';

/**
 * Process an uploaded image through the OCR pipeline.
 *
 * Flow:
 * 1. Download/read image buffer
 * 2. Send to Google Cloud Vision (documentTextDetection)
 * 3. Extract plates, VINs, chassis numbers
 * 4. Score confidence
 * 5. Persist to ocr_scans table
 * 6. Return structured result
 */
export async function processImageOcr(params: {
  imageBuffer: Buffer;
  imageUrl: string;
  documentType: DocType;
  userId: string;
  source?: OcrSource;
}): Promise<OcrScanResponse> {
  const { imageBuffer, imageUrl, documentType, userId, source = 'user_upload' } = params;

  // Step 1: Run Vision API OCR
  const visionResult = await detectText(imageBuffer);

  if (!visionResult.fullText.trim()) {
    // No text detected — save empty result
    return await saveOcrScan({
      userId,
      imageUrl,
      documentType,
      source,
      visionResult,
      extraction: emptyExtraction(),
      confidence: 0,
    });
  }

  // Step 2: Extract plate, VIN, chassis from OCR text
  const plates = extractPlates(visionResult.fullText);
  const vins = extractVins(visionResult.fullText);
  const chassis = extractChassis(visionResult.fullText);

  const extraction: OcrExtractionResult = {
    plates,
    vins,
    chassis,
    bestPlate: plates[0] ?? null,
    bestVin: vins[0] ?? null,
    bestChassis: chassis[0] ?? null,
    overallConfidence: 0, // calculated below
  };

  // Step 3: Calculate overall confidence
  const confidence = calculateOverallConfidence(visionResult, extraction);
  extraction.overallConfidence = confidence;

  // Step 4: Persist to ocr_scans
  return await saveOcrScan({
    userId,
    imageUrl,
    documentType,
    source,
    visionResult,
    extraction,
    confidence,
  });
}

/**
 * Save OCR scan result to database.
 */
async function saveOcrScan(params: {
  userId: string;
  imageUrl: string;
  documentType: DocType;
  source: OcrSource;
  visionResult: VisionResponse;
  extraction: OcrExtractionResult;
  confidence: number;
}): Promise<OcrScanResponse> {
  const {
    userId,
    imageUrl,
    documentType,
    source,
    visionResult,
    extraction,
    confidence,
  } = params;

  const scan = await prisma.ocrScan.create({
    data: {
      userId,
      imageUrl,
      documentType,
      source,
      rawOcrResult: visionResult as any,
      extractedPlate: extraction.bestPlate?.value ?? null,
      extractedVin: extraction.bestVin?.value ?? null,
      extractedChassis: extraction.bestChassis?.value ?? null,
      confidence,
    },
  });

  return {
    id: scan.id,
    documentType: scan.documentType as DocType,
    imageUrl: scan.imageUrl,
    extractedPlate: scan.extractedPlate,
    extractedVin: scan.extractedVin,
    extractedChassis: scan.extractedChassis,
    confidence: scan.confidence ?? 0,
    source: scan.source as OcrSource,
    rawOcrResult: visionResult,
    extraction,
  };
}

function emptyExtraction(): OcrExtractionResult {
  return {
    plates: [],
    vins: [],
    chassis: [],
    bestPlate: null,
    bestVin: null,
    bestChassis: null,
    overallConfidence: 0,
  };
}
