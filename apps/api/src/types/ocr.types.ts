// apps/api/src/types/ocr.types.ts

export type OcrTarget = 'plate' | 'vin' | 'auto';

export interface OcrScanResult {
  success: boolean;
  target: OcrTarget;
  rawText: string;
  plate?: string;
  vin?: string;
  confidence: number;
  error?: string;
}

export interface NtsaCorRequest {
  vin?: string;
  plate?: string;
}

export interface NtsaCorResponse {
  success: boolean;
  rawRecordId?: string;
  fields?: Record<string, unknown>;
  confidence?: number;
  warnings?: string[];
  error?: string;
}
