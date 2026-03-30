// apps/api/src/routes/analytics.ts

import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import {
  getBusinessMetrics,
  getWatchInsights,
  getDataJobHealth,
} from '../services/analyticsService';

const router: ReturnType<typeof Router> = Router();

/**
 * GET /analytics/business
 * Full business dashboard — admin only.
 */
router.get('/business', auth, requireRole(['admin']), async (_req: Request, res: Response) => {
  const metrics = await getBusinessMetrics();
  return res.json(metrics);
});

/**
 * GET /analytics/watch
 * Watch insights (admin view — includes pending count and approval rates).
 */
router.get(
  '/watch',
  auth,
  requireRole(['admin', 'employee']),
  async (_req: Request, res: Response) => {
    const insights = await getWatchInsights(true);
    return res.json(insights);
  }
);

/**
 * GET /watch/insights
 * Public-safe aggregated watch signals. No auth required.
 */
router.get('/watch/public', async (_req: Request, res: Response) => {
  const insights = await getWatchInsights(false);
  // Strip admin-only fields
  const { pendingCount: _p, ...publicInsights } = insights;
  return res.json(publicInsights);
});

/**
 * GET /analytics/data-jobs
 * Data job health — admin only.
 */
router.get(
  '/data-jobs',
  auth,
  requireRole(['admin']),
  async (_req: Request, res: Response) => {
    const health = await getDataJobHealth();
    return res.json(health);
  }
);

export default router;
