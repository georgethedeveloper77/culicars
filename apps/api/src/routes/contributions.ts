// apps/api/src/routes/contributions.ts

import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import {
  createContribution,
  moderateContribution,
  getPendingContributions,
  getApprovedContributions,
  getAllContributionsForVehicle,
  ContributionType,
  ContributionStatus,
} from '../services/contributionService';

const router: ReturnType<typeof Router> = Router();

const VALID_TYPES: ContributionType[] = ['odometer', 'service_record', 'damage', 'listing_photo'];

/**
 * POST /contributions
 * Submit a structured contribution. Requires auth.
 */
router.post('/', auth, async (req: Request, res: Response) => {
  const { plate, vin, type, data, evidenceUrls } = req.body;
  const userId = (req as any).user?.id;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!plate) return res.status(400).json({ error: 'plate is required' });
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
  }
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'data object is required' });
  }

  // Evidence images are required for odometer and damage contributions
  if (['odometer', 'damage'].includes(type)) {
    if (!Array.isArray(evidenceUrls) || evidenceUrls.length === 0) {
      return res.status(400).json({ error: 'Evidence image(s) required for this contribution type' });
    }
  }

  const contribution = await createContribution({
    plate,
    vin,
    type,
    data,
    evidenceUrls: evidenceUrls ?? [],
    userId,
  });

  return res.status(201).json(contribution);
});

/**
 * GET /contributions/pending
 * Moderation queue — admin and employee only.
 */
router.get('/pending', auth, requireRole(['admin', 'employee']), async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;

  const result = await getPendingContributions(limit, offset);
  return res.json(result);
});

/**
 * GET /contributions/vehicle?plate=&vin=
 * All contributions for a vehicle (admin). Approved only for regular users.
 */
router.get('/vehicle', auth, async (req: Request, res: Response) => {
  const { plate, vin } = req.query as { plate?: string; vin?: string };
  if (!plate) return res.status(400).json({ error: 'plate is required' });

  const userRole = (req as any).user?.role;
  const isStaff = ['admin', 'employee'].includes(userRole);

  const contributions = isStaff
    ? await getAllContributionsForVehicle(plate, vin)
    : await getApprovedContributions(plate, vin);

  return res.json({ contributions });
});

/**
 * PATCH /contributions/:id/moderate
 * Moderate a contribution — admin and employee only.
 * Records are immutable — rejected records are retained for audit.
 */
router.patch(
  '/:id/moderate',
  auth,
  requireRole(['admin', 'employee']),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, moderatorNote } = req.body;
    const moderatorId = (req as any).user?.id;

    const VALID_STATUSES: ContributionStatus[] = [
      'approved',
      'rejected',
      'disputed',
      'needs_more_info',
      'archived',
    ];

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const updated = await moderateContribution(id, status, moderatorNote, moderatorId);
    return res.json(updated);
  }
);

export default router;
