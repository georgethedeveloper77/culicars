// ============================================================
// CuliCars — Thread 4: NTSA Route
// ============================================================
// POST /ntsa/consent    — Log user consent before COR fetch
// POST /ocr/ntsa-cor    — Process auto-intercepted COR PDF
//
// CRITICAL: No upload button. PDF URL intercepted by mobile app.
// Owner name/ID/address DISCARDED on parse.

import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  consentBodySchema,
  ntsaCorBodySchema,
} from '../validators/ocrValidator';
import prisma from '../lib/prisma';
import { normalizePlate } from '@culicars/utils';
import { downloadFile, uploadFile, UploadError } from '../storage/uploadHandler';
import { detectTextFromPdf } from '../services/visionClient';
import { parseCorText } from '../services/ntsaCorParser';
import { enrichFromCor } from '../services/corEnrichService';
import type { NtsaCorProcessResponse } from '../types/ocr.types';

const router = Router();

/**
 * POST /ntsa/consent
 *
 * Body (JSON):
 *   - vin: string (17 chars)
 *   - plate: string
 *
 * Auth: Required
 *
 * Logs user consent before they open eCitizen in-app browser.
 * Must be called before POST /ocr/ntsa-cor.
 */
router.post(
  '/consent',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bodyResult = consentBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: bodyResult.error.issues.map((i) => i.message).join('; '),
          statusCode: 400,
        });
      }

      const { vin, plate } = bodyResult.data;
      const userId = req.user!.id;
      const normalizedPlate = normalizePlate(plate);

      // Check for existing unprocessed consent
      const existing = await prisma.corConsent.findFirst({
        where: {
          userId,
          vin,
          plate: normalizedPlate,
          pdfProcessed: false,
        },
      });

      if (existing) {
        return res.status(200).json({
          success: true,
          data: {
            id: existing.id,
            vin: existing.vin,
            plate: existing.plate,
            consentedAt: existing.consentedAt,
          },
          message: 'Existing consent found.',
        });
      }

      const consent = await prisma.corConsent.create({
        data: {
          userId,
          vin,
          plate: normalizedPlate,
        },
      });

      return res.status(201).json({
        success: true,
        data: {
          id: consent.id,
          vin: consent.vin,
          plate: consent.plate,
          consentedAt: consent.consentedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /ocr/ntsa-cor
 *
 * Body (JSON):
 *   - pdfUrl: string (URL intercepted from eCitizen WebView)
 *   - consentId: string (UUID from /ntsa/consent)
 *
 * Auth: Required
 *
 * Flow:
 * 1. Validate consent exists and is unprocessed
 * 2. Download PDF from intercepted URL
 * 3. Upload PDF to Supabase Storage
 * 4. Run Vision API OCR on PDF
 * 5. Parse COR fields (DISCARD owner info)
 * 6. Enrich vehicle data (update vehicles, plate_vin_map, events)
 * 7. Return parsed result
 */
router.post(
  '/ntsa-cor',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bodyResult = ntsaCorBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: bodyResult.error.issues.map((i) => i.message).join('; '),
          statusCode: 400,
        });
      }

      const { pdfUrl, consentId } = bodyResult.data;
      const userId = req.user!.id;

      // Step 1: Validate consent
      const consent = await prisma.corConsent.findUnique({
        where: { id: consentId },
      });

      if (!consent) {
        return res.status(404).json({
          error: 'CONSENT_NOT_FOUND',
          message: 'No consent record found. Call POST /ntsa/consent first.',
          statusCode: 404,
        });
      }

      if (consent.userId !== userId) {
        return res.status(403).json({
          error: 'CONSENT_MISMATCH',
          message: 'Consent does not belong to this user.',
          statusCode: 403,
        });
      }

      if (consent.pdfProcessed) {
        return res.status(409).json({
          error: 'ALREADY_PROCESSED',
          message: 'This COR has already been processed.',
          statusCode: 409,
        });
      }

      // Step 2: Download PDF from intercepted URL
      const { buffer: pdfBuffer, mimeType } = await downloadFile(pdfUrl);

      // Step 3: Upload PDF to Supabase Storage for audit trail
      const uploaded = await uploadFile(
        pdfBuffer,
        `ntsa-cor-${consentId}.pdf`,
        mimeType,
        userId
      );

      // Step 4: Run Vision API OCR on PDF
      const visionResult = await detectTextFromPdf(pdfBuffer);

      if (!visionResult.fullText.trim()) {
        return res.status(422).json({
          error: 'OCR_FAILED',
          message: 'Could not extract text from the COR PDF. The document may be corrupted or empty.',
          statusCode: 422,
        });
      }

      // Step 5: Parse COR fields (owner info DISCARDED here)
      const parsed = parseCorText(visionResult.fullText);

      if (!parsed.vin || !parsed.plate) {
        return res.status(422).json({
          error: 'PARSE_FAILED',
          message: 'Could not extract plate and VIN from COR. OCR quality may be insufficient.',
          statusCode: 422,
        });
      }

      // Step 6: Save OCR scan record
      const ocrScan = await prisma.ocrScan.create({
        data: {
          userId,
          imageUrl: uploaded.url,
          documentType: 'ntsa_cor',
          source: 'ntsa_cor_auto',
          rawOcrResult: visionResult as any,
          extractedPlate: parsed.plate,
          extractedVin: parsed.vin,
          extractedChassis: parsed.vin,
          confidence: visionResult.confidence,
        },
      });

      // Step 7: Enrich vehicle data from COR
      const enrichment = await enrichFromCor(parsed, consentId, userId);

      const response: NtsaCorProcessResponse = {
        ocrScanId: ocrScan.id,
        parsed,
        vehicleUpdated: enrichment.vehicleUpdated || enrichment.vehicleCreated,
        plateVinMapUpdated: enrichment.plateVinMapUpdated,
        eventsCreated: enrichment.eventsCreated,
      };

      return res.status(200).json({
        success: true,
        data: response,
      });
    } catch (err) {
      if (err instanceof UploadError) {
        return res.status(400).json({
          error: 'PDF_FETCH_ERROR',
          message: err.message,
          statusCode: 400,
        });
      }
      next(err);
    }
  }
);

export default router;
