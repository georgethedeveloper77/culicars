// ============================================================
// CuliCars — Thread 4: OCR Types
// ============================================================

import type { DocType, OcrSource } from '@culicars/database';

// ---- Google Cloud Vision ----

export interface VisionAnnotation {
  text: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface BoundingBox {
  vertices: Array<{ x: number; y: number }>;
}

export interface VisionResponse {
  fullText: string;
  blocks: VisionAnnotation[];
  confidence: number;
}

// ---- OCR Extraction Results ----

export interface ExtractedPlate {
  value: string;          // normalized: 'KCA123A'
  display: string;        // formatted: 'KCA 123A'
  confidence: number;     // 0.0–1.0
  raw: string;            // original OCR text matched
}

export interface ExtractedVin {
  value: string;          // 17-char VIN
  confidence: number;
  raw: string;
  isValid: boolean;       // ISO 3779 check digit pass
}

export interface ExtractedChassis {
  value: string;
  confidence: number;
  raw: string;
}

export interface OcrExtractionResult {
  plates: ExtractedPlate[];
  vins: ExtractedVin[];
  chassis: ExtractedChassis[];
  bestPlate: ExtractedPlate | null;
  bestVin: ExtractedVin | null;
  bestChassis: ExtractedChassis | null;
  overallConfidence: number;
}

// ---- OCR Scan Request/Response ----

export interface OcrScanRequest {
  documentType: DocType;
  imageUrl?: string;       // if already uploaded to Supabase Storage
}

export interface OcrScanResponse {
  id: string;
  documentType: DocType;
  imageUrl: string;
  extractedPlate: string | null;
  extractedVin: string | null;
  extractedChassis: string | null;
  confidence: number;
  source: OcrSource;
  rawOcrResult: VisionResponse;
  extraction: OcrExtractionResult;
}

// ---- NTSA COR (Certificate of Registration) ----

export interface NtsaCorRawFields {
  registrationNumber: string | null;   // plate
  chassisNumber: string | null;        // VIN / chassis
  make: string | null;
  model: string | null;
  bodyType: string | null;
  color: string | null;
  yearOfManufacture: number | null;
  engineCapacity: string | null;
  fuelType: string | null;
  registrationDate: string | null;
  inspectionStatus: string | null;
  inspectionDate: string | null;
  caveatStatus: string | null;
  logbookNumber: string | null;
  numberOfTransfers: number | null;
  lastTransferDate: string | null;
  // DISCARDED on parse — never stored:
  // ownerName, ownerIdNumber, ownerAddress, ownerPhone
}

export interface NtsaCorParsed {
  plate: string;              // normalized
  plateDisplay: string;       // formatted
  vin: string;                // chassis/VIN from COR
  make: string | null;
  model: string | null;
  bodyType: string | null;
  color: string | null;
  yearOfManufacture: number | null;
  engineCapacity: number | null;
  fuelType: string | null;
  registrationDate: Date | null;
  inspectionStatus: 'passed' | 'failed' | 'expired' | 'unknown';
  inspectionDate: Date | null;
  caveatStatus: 'clear' | 'caveat' | 'unknown';
  logbookNumber: string | null;
  numberOfTransfers: number | null;
  lastTransferDate: Date | null;
}

export interface NtsaCorProcessRequest {
  pdfUrl: string;             // intercepted from WebView
  consentId: string;          // from cor_consents
}

export interface NtsaCorProcessResponse {
  ocrScanId: string;
  parsed: NtsaCorParsed;
  vehicleUpdated: boolean;
  plateVinMapUpdated: boolean;
  eventsCreated: number;
}

// ---- Consent ----

export interface ConsentRequest {
  vin: string;
  plate: string;
}

export interface ConsentResponse {
  id: string;
  vin: string;
  plate: string;
  consentedAt: Date;
}

// ---- Upload ----

export interface UploadResult {
  url: string;
  path: string;
  bucket: string;
}
