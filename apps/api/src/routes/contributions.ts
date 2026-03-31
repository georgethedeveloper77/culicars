// apps/api/src/routes/contributions.ts

import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { optionalAuth } from '../middleware/auth';
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
 * Submit a contribution. Auth optional — anonymous allowed.
 */
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  // accept both 'data' and 'dataJson' for forward-compat
  const { plate, vin, type, data, dataJson, evidenceUrls } = req.body;
  const payload = data ?? dataJson;
  const userId = (req as any).user?.id ?? null;

  if (!plate) return res.status(400).json({ error: 'plate is required' });
  if (!type || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
  }
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ error: 'data (or dataJson) object is required' });
  }

  const contribution = await createContribution({
    plate,
    vin,
    type,
    data: payload,
    evidenceUrls: evidenceUrls ?? [],
    userId,
  });

  return res.status(201).json(contribution);
});

/**
 * GET /contributions/vin/:vin
 * All approved contributions for a VIN — public.
 */
router.get('/vin/:vin', async (req: Request, res: Response) => {
  const { vin } = req.params;
  if (!vin) return res.status(400).json({ error: 'vin is required' });

  const contributions = await getApprovedContributions(undefined, vin);
  return res.json({ contributions });
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
      'approved', 'rejected', 'disputed', 'needs_more_info', 'archived',
    ];

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const updated = await moderateContribution(id, status, moderatorNote, moderatorId);
    return res.json(updated);
  }
);

export default router;
