// apps/api/src/services/ocrService.ts

import { visionClient } from './visionClient';
import { plateExtractor } from './plateExtractor';
import { vinExtractor } from './vinExtractor';
import { ocrConfidence } from './ocrConfidence';
import type { OcrScanResult, OcrTarget } from '../types/ocr.types';

export type OcrMode = 'auto' | 'plate' | 'vin';

export interface OcrScanOptions {
  mode?: OcrMode;
  imageBuffer?: Buffer;
  imageBase64?: string;
  mimeType?: string;
}

export interface OcrScanOutput {
  success: boolean;
  mode: OcrMode;
  rawText: string;
  plate?: string;
  vin?: string;
  confidence: number;
  error?: string;
}

async function scan(opts: OcrScanOptions): Promise<OcrScanOutput> {
  const { mode = 'auto', imageBuffer, imageBase64, mimeType = 'image/jpeg' } = opts;

  if (!imageBuffer && !imageBase64) {
    return {
      success: false,
      mode,
      rawText: '',
      confidence: 0,
      error: 'No image data provided',
    };
  }

  const b64 = imageBase64 ?? imageBuffer!.toString('base64');

  let rawText: string;
  try {
    rawText = await visionClient.detectText(b64, mimeType);
  } catch (err: any) {
    return {
      success: false,
      mode,
      rawText: '',
      confidence: 0,
      error: `Vision API error: ${err?.message ?? String(err)}`,
    };
  }

  const conf = ocrConfidence.score(rawText);

  if (mode === 'vin') {
    const vin = vinExtractor.extract(rawText);
    return {
      success: !!vin,
      mode,
      rawText,
      vin: vin ?? undefined,
      confidence: vin ? conf : 0,
    };
  }

  if (mode === 'plate') {
    const plate = plateExtractor.extract(rawText);
    return {
      success: !!plate,
      mode,
      rawText,
      plate: plate ?? undefined,
      confidence: plate ? conf : 0,
    };
  }

  // auto — try plate first, then VIN
  const plate = plateExtractor.extract(rawText);
  if (plate) {
    return { success: true, mode: 'plate', rawText, plate, confidence: conf };
  }

  const vin = vinExtractor.extract(rawText);
  if (vin) {
    return { success: true, mode: 'vin', rawText, vin, confidence: conf };
  }

  return {
    success: false,
    mode: 'auto',
    rawText,
    confidence: 0,
    error: 'Could not extract plate or VIN from image',
  };
}

export const ocrService = { scan };
