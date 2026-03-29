// apps/api/src/routes/admin/demandQueue.ts

import { Router, Request, Response, IRouter } from 'express';
import { auth } from '../../middleware/auth';
import { listQueue, markEnriched } from '../../services/searchDemandQueueService';

// TODO: replace with your actual auth middleware exports from ../../middleware/auth
// e.g. import { authenticateToken, requireAdminRole } from '../../middleware/auth';
// then add as route middleware: router.get('/', authenticateToken, requireAdminRole, async ...)

const router: IRouter = Router();

/**
 * GET /admin/demand-queue
 * List unenriched demand queue entries. Paginated.
 * Query params: page, pageSize, state
 */
router.get('/', auth, async (req: Request, res: Response) => {
  const page     = parseInt((req.query.page     as string) ?? '1',  10);
  const pageSize = parseInt((req.query.pageSize as string) ?? '25', 10);
  const state    = req.query.state as string | undefined;

  const result = await listQueue({ page, pageSize, state });

  res.json({ success: true, data: result });
});

/**
 * PATCH /admin/demand-queue/mark-enriched
 * Manually clear a vehicle from the pending queue.
 */
router.patch('/mark-enriched', auth, async (req: Request, res: Response) => {
  const { vin, plate } = req.body as { vin?: string; plate?: string };

  if (!vin && !plate) {
    return res.status(400).json({ success: false, error: 'Provide vin or plate' });
  }

  await markEnriched({ vin, plate });
  return res.json({ success: true });
});

export default router;
