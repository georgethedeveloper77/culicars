// apps/api/src/routes/ocr.ts

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { auth as authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { ocrService } from '../services/ocrService';
import { corEnrichService } from '../services/corEnrichService';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';

const router = Router();

// multer: memory storage, 10 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
});

// ─── POST /ocr/scan ──────────────────────────────────────────────────────────
// Accepts an image upload and returns extracted plate or VIN text.
// Public endpoint — no auth required; rate-limited upstream.
router.post('/scan', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  const mode = (req.body?.mode as string) || 'auto';
  if (!['auto', 'plate', 'vin'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode. Use auto, plate, or vin' });
  }

  const result = await ocrService.scan({
    mode: mode as 'auto' | 'plate' | 'vin',
    imageBuffer: req.file.buffer,
    mimeType: req.file.mimetype,
  });

  if (!result.success) {
    return res.status(422).json({
      success: false,
      error: result.error ?? 'Could not extract text from image',
      rawText: result.rawText,
    });
  }

  return res.json({
    success: true,
    mode: result.mode,
    plate: result.plate,
    vin: result.vin,
    confidence: result.confidence,
  });
});

// ─── POST /ocr/ntsa-cor ──────────────────────────────────────────────────────
// Admin-only. Accepts a COR PDF and enriches the vehicle record.
// Respects ntsa_fetch_enabled config key.
router.post(
  '/ntsa-cor',
  authMiddleware,
  requireRole('admin', 'employee'),
  upload.single('pdf'),
  async (req: Request, res: Response) => {
    // check admin config toggle
    const ntsa_fetch_enabled = await getNtsaFetchEnabled();
    if (!ntsa_fetch_enabled) {
      return res.status(503).json({
        success: false,
        error: 'Official record fetch is currently disabled by admin configuration',
        code: 'NTSA_FETCH_DISABLED',
      });
    }

    const { vin, plate } = req.body as { vin?: string; plate?: string };

    if (!vin && !plate) {
      return res.status(400).json({ error: 'Provide vin or plate' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be a PDF' });
    }

    const result = await corEnrichService.enrichFromPdf({
      vin: vin ?? '',
      plate,
      pdfBuffer: req.file.buffer,
      triggeredBy: (req as any).user?.id,
    });

    if (!result.success) {
      return res.status(422).json({
        success: false,
        error: result.error,
        parseResult: result.parseResult,
      });
    }

    return res.status(201).json({
      success: true,
      rawRecordId: result.rawRecordId,
      fields: result.parseResult?.fields,
      confidence: result.parseResult?.confidence,
      warnings: result.parseResult?.warnings,
    });
  },
);

// ─── GET /ocr/ntsa-cor/last/:vin ─────────────────────────────────────────────
// Admin-only. Returns the most recent COR parse result for a VIN.
router.get(
  '/ntsa-cor/last/:vin',
  authMiddleware,
  requireRole('admin', 'employee'),
  async (req: Request, res: Response) => {
    const { vin } = req.params;

    const record = await prisma.rawRecord.findFirst({
      where: {
        vin: vin.toUpperCase(),
        source: 'ntsa_cor',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return res.status(404).json({ error: 'No COR records found for this VIN' });
    }

    return res.json({
      id: record.id,
      vin: record.vin,
      plate: record.plate,
      source: record.source,
      confidence: record.confidence,
      normalisedData: record.normalisedJson,
      createdAt: record.createdAt,
    });
  },
);

// ─── helpers ─────────────────────────────────────────────────────────────────

async function getNtsaFetchEnabled(): Promise<boolean> {
  try {
    const cfg = await prisma.adminSetting.findUnique({
  where: { key: 'ntsa_fetch_enabled' },
});
if (!cfg) return true;
return cfg.value === true || cfg.value === 'true';
  } catch {
    return true; // fail open — allow fetch if config table not yet seeded
  }
}

export default router;
