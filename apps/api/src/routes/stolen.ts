// apps/api/src/routes/stolen.ts

import { Router, Request, Response, NextFunction } from 'express';
import {
  submitReport,
  getByPlate,
  getByVin,
  getById,
  reviewReport,
  markRecovered,
} from '../services/stolenReportService';
import { requireRole } from '../middleware/requireRole';
import { validateStolenSubmission, validateRecoverySubmission } from '../validators/stolenValidator';

const router: import("express").Router = Router();

// ---------------------------------------------------------------------------
// POST /stolen-reports
// Public — no account required
// ---------------------------------------------------------------------------
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validateStolenSubmission(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const userId = (req as Request & { user?: { id: string } }).user?.id ?? null;
    const report = await submitReport(req.body, userId);

    return res.status(201).json({
      report,
      message:
        'Your report has been received and is under review. We will contact you if we need more information.',
    });
  } catch (err: unknown) {
    const typed = err as { status?: number; message?: string };
    if (typed.status === 409) {
      return res.status(409).json({ error: typed.message });
    }
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /stolen-reports/plate/:plate  — FREE, no credits
// ---------------------------------------------------------------------------
router.get('/plate/:plate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await getByPlate(req.params.plate);
    const hasActiveReport = reports.some((r) => r.status === 'active');
    return res.json({ hasActiveReport, reports });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /stolen-reports/vin/:vin  — FREE, no credits
// ---------------------------------------------------------------------------
router.get('/vin/:vin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await getByVin(req.params.vin);
    const hasActiveReport = reports.some((r) => r.status === 'active');
    return res.json({ hasActiveReport, reports });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /stolen-reports/:id
// ---------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await getById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Hide contact info from non-admin, non-reporter
    const reqWithUser = req as Request & { user?: { id: string; role: string } };
    const isAdmin = reqWithUser.user?.role === 'admin';
    const isReporter = reqWithUser.user?.id === report.reporterUserId;

    if (!isAdmin && !isReporter) {
      const { contactPhone: _, contactEmail: __, ...safeReport } = report;
      return res.json({ report: safeReport });
    }

    return res.json({ report });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /stolen-reports/:id/review  (admin only)
// ---------------------------------------------------------------------------
router.patch(
  '/:id/review',
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, adminNote, isObVerified } = req.body;

      if (!['active', 'rejected', 'duplicate'].includes(status)) {
        return res.status(400).json({
          error: 'status must be one of: active, rejected, duplicate',
        });
      }

      const adminUserId = (req as Request & { user: { id: string } }).user.id;
      const report = await reviewReport(
        req.params.id,
        { status, adminNote, isObVerified },
        adminUserId,
      );

      return res.json({ report });
    } catch (err) {
      next(err);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /stolen-reports/:id/recovered
// Owner (or admin) marks vehicle as recovered
// ---------------------------------------------------------------------------
router.post('/:id/recovered', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validateRecoverySubmission(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const userId = (req as Request & { user?: { id: string } }).user?.id ?? null;
    const report = await markRecovered(req.params.id, req.body, userId);

    return res.json({
      report,
      message: 'Thank you for updating us. The vehicle has been marked as recovered.',
    });
  } catch (err: unknown) {
    const typed = err as { status?: number; message?: string };
    if (typed.status === 400 || typed.status === 403) {
      return res.status(typed.status).json({ error: typed.message });
    }
    next(err);
  }
});

export default router;
