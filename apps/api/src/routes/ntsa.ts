// apps/api/src/routes/ntsa.ts
import { Router } from 'express';
import type { Router as RouterType, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { visionClient } from '../services/visionClient';
import { ntsaCorParser } from '../services/ntsaCorParser';
import { corEnrichService } from '../services/corEnrichService';
import type { NtsaCorResponse } from '../types/ocr.types';

const router: RouterType = Router();

// ── Zod schemas (validateCorRequest is a middleware, not a schema — use Zod here) ──
const consentSchema = z.object({
  vin: z.string().min(1),
  plate: z.string().min(1),
});

const ntsaCorSchema = z.object({
  vin: z.string().optional(),
  plate: z.string().optional(),
  pdfBase64: z.string().optional(),
  pdfUrl: z.string().url().optional(),
  consentId: z.string().uuid().optional(),
});

// ── POST /ntsa/consent ────────────────────────────────────────────────────────
// Log user consent before opening the eCitizen WebView
router.post(
  '/consent',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = consentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: result.error.issues.map((i: any) => i.message).join('; '),
        });
      }

      const { vin, plate } = result.data;
      const userId = req.user!.id;

      const consent = await prisma.cor_consents.create({
        data: {
          user_id: userId,
          vin,
          plate,
          pdf_processed: false,
        },
      });

      res.json({
        success: true,
        consentId: consent.id,
        message: 'Consent recorded. Proceed to eCitizen.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /ntsa/cor ────────────────────────────────────────────────────────────
// Auto-intercepted PDF → parse → enrich vehicle record
// Called when user's WebView intercepts the COR PDF download
router.post(
  '/cor',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = ntsaCorSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: result.error.issues.map((i: any) => i.message).join('; '),
        });
      }

      const { vin, plate, pdfBase64, pdfUrl, consentId } = result.data;
      const userId = req.user!.id;

      if (!pdfBase64 && !pdfUrl) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Either pdfBase64 or pdfUrl is required',
        });
      }

      // ── 1. Get base64 PDF ──────────────────────────────────────────────────
      let base64: string;

      if (pdfBase64) {
        base64 = pdfBase64;
      } else {
        // Fetch from URL and convert to base64
        const response = await fetch(pdfUrl!);
        if (!response.ok) {
          return res.status(400).json({
            error: 'FETCH_ERROR',
            message: 'Could not retrieve PDF from URL',
          });
        }
        const arrayBuffer = await response.arrayBuffer();
        base64 = Buffer.from(arrayBuffer).toString('base64');
      }

      // ── 2. Extract text via Vision API ────────────────────────────────────
      const rawText = await visionClient.detectTextInPdf(base64);

      if (!rawText.trim()) {
        return res.status(422).json({
          error: 'OCR_FAILED',
          message: 'Could not extract text from the PDF',
        });
      }

      // ── 3. Parse COR fields ───────────────────────────────────────────────
      const parsed = ntsaCorParser.parse(rawText);

      const extractedVin = parsed.fields?.vin ?? vin ?? null;
      const extractedPlate = parsed.fields?.plate ?? plate ?? null;

      if (!extractedVin && !extractedPlate) {
        return res.status(422).json({
          error: 'PARSE_FAILED',
          message: 'Could not identify vehicle from the document',
          warnings: parsed.warnings,
        });
      }

      // ── 4. Record the OCR scan ────────────────────────────────────────────
      const ocrScan = await prisma.ocr_scans.create({
        data: {
          user_id: userId,
          image_url: pdfUrl ?? 'base64-upload',
          document_type: 'ntsa_cor',
          raw_ocr_result: { text: rawText } as any,
          extracted_plate: extractedPlate ?? null,
          extracted_vin: extractedVin ?? null,
          extracted_chassis: extractedVin ?? null,
          confidence: parsed.confidence,
          source: 'ntsa_cor_auto',
        },
      });

      // ── 5. Mark consent as processed ─────────────────────────────────────
      if (consentId) {
        await prisma.cor_consents.updateMany({
          where: { id: consentId, user_id: userId },
          data: { pdf_processed: true, processed_at: new Date() },
        }).catch(() => {}); // non-blocking
      }

      // ── 6. Enrich vehicle record ──────────────────────────────────────────
      const enrichment = await corEnrichService.enrichFromPdf({
        vin: extractedVin ?? '',
        plate: extractedPlate ?? undefined,
        pdfBase64: base64,
        triggeredBy: userId,
      });

      // ── 7. Respond ────────────────────────────────────────────────────────
      const responseBody: NtsaCorResponse = {
        success: enrichment.success,
        rawRecordId: enrichment.rawRecordId,
        fields: (parsed.fields as any),
        confidence: parsed.confidence,
        warnings: parsed.warnings,
        error: enrichment.error,
      };

      res.json({
        ...responseBody,
        ocrScanId: ocrScan.id,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /ntsa/cor/last/:vin ───────────────────────────────────────────────────
// Returns the most recent raw_record for a VIN (used by admin OCR page)
router.get(
  '/cor/last/:vin',
  auth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vin = req.params.vin.toUpperCase();

      const record = await prisma.raw_records.findFirst({
        where: { vin, source: 'ntsa_cor' },
        orderBy: { created_at: 'desc' },
      });

      if (!record) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'No records available for this vehicle yet',
        });
      }

      res.json({
        id: record.id,
        vin: record.vin,
        plate: record.plate,
        source: record.source,
        normalisedData: record.normalised_json,
        confidence: record.confidence,
        created_at: record.created_at,
      });
    } catch (err) {
      next(err);
    }
  }
);

export { router as ntsaRouter };
