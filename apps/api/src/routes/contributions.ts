// apps/api/src/routes/contributions.ts

import { Router, Request, Response, NextFunction } from 'express';
import { validateContributionSubmission } from '../services/contributionValidator';
import {
  submitContribution,
  getContributionsByVin,
  moderateContribution,
  getContributionById,
} from '../services/contributionService';
import { requireRole } from '../middleware/requireRole';

const router: import("express").Router = Router();

// ---------------------------------------------------------------------------
// POST /contributions
// Submit a new contribution — no account required (optionalAuth applied in app.ts)
// ---------------------------------------------------------------------------
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validateContributionSubmission(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const userId = (req as Request & { user?: { id: string } }).user?.id ?? null;
    const contribution = await submitContribution(req.body, userId);

    return res.status(201).json({ contribution });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /contributions/vin/:vin
// List approved contributions for a vehicle
// Admin gets all (pending, flagged, rejected too)
// ---------------------------------------------------------------------------
router.get('/vin/:vin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin =
      (req as Request & { user?: { role: string } }).user?.role === 'admin';
    const contributions = await getContributionsByVin(req.params.vin, isAdmin);
    return res.json({ contributions });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /contributions/:id
// Get a single contribution (admin or owner)
// ---------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contribution = await getContributionById(req.params.id);
    if (!contribution) {
      return res.status(404).json({ error: 'Contribution not found' });
    }

    const reqWithUser = req as Request & { user?: { id: string; role: string } };
    const userId = reqWithUser.user?.id;
    const isAdmin = reqWithUser.user?.role === 'admin';
    const isOwner = contribution.user_id === userId;

    if (!isAdmin && !isOwner && contribution.status !== 'approved') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json({ contribution });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PATCH /contributions/:id/moderate  (admin only)
// ---------------------------------------------------------------------------
router.patch(
  '/:id/moderate',
  requireRole('admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, adminNote } = req.body;

      if (!['approved', 'rejected', 'flagged'].includes(status)) {
        return res.status(400).json({
          error: 'status must be one of: approved, rejected, flagged',
        });
      }

      const adminUserId = (req as Request & { user: { id: string } }).user.id;
      const contribution = await moderateContribution(
        req.params.id,
        { status, adminNote },
        adminUserId,
      );

      return res.json({ contribution });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
