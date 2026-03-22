// ============================================================
// CuliCars — Thread 4: OCR Validators
// ============================================================

import { z } from 'zod';

export const ocrScanBodySchema = z.object({
  documentType: z.enum([
    'logbook',
    'import_doc',
    'dashboard',
    'plate_photo',
  ]),
});

export const ntsaCorBodySchema = z.object({
  pdfUrl: z
    .string()
    .url('pdfUrl must be a valid URL')
    .refine(
      (url) => url.includes('ecitizen.go.ke') || url.includes('ntsa.go.ke'),
      'PDF URL must originate from eCitizen or NTSA domain'
    ),
  consentId: z.string().uuid('consentId must be a valid UUID'),
});

export const consentBodySchema = z.object({
  vin: z.string().length(17, 'VIN must be 17 characters'),
  plate: z.string().min(2, 'Plate is required').max(15),
});

export type OcrScanBody = z.infer<typeof ocrScanBodySchema>;
export type NtsaCorBody = z.infer<typeof ntsaCorBodySchema>;
export type ConsentBody = z.infer<typeof consentBodySchema>;
