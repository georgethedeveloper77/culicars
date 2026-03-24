// ============================================================
// CuliCars — Thread 5: Reports Route
// GET /reports/by-vin/:vin    — get or generate report by VIN
// GET /reports/:id            — full report by ID
// GET /reports/:id/preview    — preview (summary only)
// POST /reports/:id/unlock    — unlock with credits
// ============================================================

import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  getOrGenerateByVin,
  getFullReport,
  getReportPreview,
} from '../services/reportService';
import { unlockReport } from '../services/reportUnlockService';
import {
  getReportByVinSchema,
  getReportByIdSchema,
  unlockReportSchema,
} from '../validators/reportValidator';

const router: import("express").Router = Router();

/**
 * GET /reports/by-vin/:vin
 * Get or generate report for a VIN.
 * Auth: optional (guests get locked sections, authed users get unlock status)
 */
router.get(
  '/by-vin/:vin',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = getReportByVinSchema.safeParse({ params: req.params });
      if (!parsed.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid VIN',
          statusCode: 400,
        });
      }

      const { vin } = parsed.data.params;
      const userId = (req as any).user?.id;

      // Get or generate report
      const reportId = await getOrGenerateByVin(vin);

      // Return full report
      const report = await getFullReport(reportId, userId);

      if (!report) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Report could not be generated',
          statusCode: 404,
        });
      }

      return res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /reports/:id
 * Get full report by report ID.
 * Auth: optional
 */
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = getReportByIdSchema.safeParse({ params: req.params });
      if (!parsed.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid report ID',
          statusCode: 400,
        });
      }

      const { id } = parsed.data.params;
      const userId = (req as any).user?.id;

      const report = await getFullReport(id, userId);

      if (!report) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Report not found',
          statusCode: 404,
        });
      }

      return res.json({ success: true, data: report });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /reports/:id/preview
 * Get report preview (summary, no full section data).
 * Auth: optional
 */
router.get(
  '/:id/preview',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = getReportByIdSchema.safeParse({ params: req.params });
      if (!parsed.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid report ID',
          statusCode: 400,
        });
      }

      const { id } = parsed.data.params;
      const userId = (req as any).user?.id;

      const preview = await getReportPreview(id, userId);

      if (!preview) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Report not found',
          statusCode: 404,
        });
      }

      return res.json({ success: true, data: preview });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /reports/:id/unlock
 * Unlock a report with credits.
 * Auth: REQUIRED — must be logged in with credits.
 */
router.post(
  '/:id/unlock',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = unlockReportSchema.safeParse({ params: req.params });
      if (!parsed.success) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message || 'Invalid report ID',
          statusCode: 400,
        });
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Login required to unlock reports',
          statusCode: 401,
        });
      }

      const { id } = parsed.data.params;

      const result = await unlockReport(userId, id);

      return res.json({ success: true, data: result });
    } catch (err: any) {
      // Handle known business errors
      if (err.message?.includes('Insufficient credits')) {
        return res.status(402).json({
          error: 'INSUFFICIENT_CREDITS',
          message: err.message,
          statusCode: 402,
        });
      }
      if (err.message?.includes('Wallet not found')) {
        return res.status(402).json({
          error: 'NO_WALLET',
          message: err.message,
          statusCode: 402,
        });
      }
      if (err.message?.includes('Report not found')) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: err.message,
          statusCode: 404,
        });
      }
      if (err.message?.includes('not ready')) {
        return res.status(409).json({
          error: 'REPORT_NOT_READY',
          message: err.message,
          statusCode: 409,
        });
      }
      next(err);
    }
  }
);

export default router;
