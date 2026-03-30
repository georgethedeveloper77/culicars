// apps/api/src/routes/watchInsights.ts
// Public-safe aggregated Watch signals. No individual records exposed.
// Mount in app.ts: app.use('/watch/insights', watchInsightsRouter);

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /watch/insights — platform-wide signals
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [hotspots, topAlertTypes, recentCount] = await Promise.all([
      // Top 5 hotspot areas (bounding box clusters – simplified)
      prisma.$queryRaw<{ area: string; count: bigint }[]>`
        SELECT
          CONCAT(ROUND(CAST(lat AS NUMERIC), 2), ',', ROUND(CAST(lng AS NUMERIC), 2)) AS area,
          COUNT(*) AS count
        FROM watch_alerts
        WHERE status = 'approved'
          AND lat IS NOT NULL
          AND lng IS NOT NULL
        GROUP BY area
        ORDER BY count DESC
        LIMIT 5
      `,

      // Alert type breakdown
      prisma.$queryRaw<{ type: string; count: bigint }[]>`
        SELECT type, COUNT(*) AS count
        FROM watch_alerts
        WHERE status = 'approved'
        GROUP BY type
        ORDER BY count DESC
      `,

      // Total approved last 30 days
      (prisma as any).watchAlert.count({
        where: {
          status: 'approved',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    res.json({
      hotspots: hotspots.map((h) => ({ area: h.area, count: Number(h.count) })),
      alertTypes: topAlertTypes.map((a) => ({ type: a.type, count: Number(a.count) })),
      recentCount,
    });
  } catch (err) {
    console.error('[GET /watch/insights]', err);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// GET /watch/insights/vehicle?plate=&vin= — vehicle-specific signals for report Community Insights section
router.get('/vehicle', async (req: Request, res: Response) => {
  try {
    const { plate, vin } = req.query as { plate?: string; vin?: string };
    if (!plate && !vin) return res.status(400).json({ error: 'plate or vin required' });

    const where: Record<string, unknown> = { status: 'approved' };
    if (plate) where.plate = plate;
    if (vin && !plate) where.vin = vin;

    const [alerts, count] = await Promise.all([
      (prisma as any).watchAlert.findMany({
        where,
        select: { type: true, description: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      (prisma as any).watchAlert.count({ where }),
    ]);

    const hasAlerts = count > 0;
    const types: string[] = [...new Set(alerts.map((a: any) => a.type))];

    res.json({
      hasAlerts,
      alertCount: count,
      alertTypes: types,
      recentAlerts: alerts,
      summary: hasAlerts
        ? `This vehicle has ${count} community alert${count !== 1 ? 's' : ''} on record.`
        : 'No community alerts on record for this vehicle.',
    });
  } catch (err) {
    console.error('[GET /watch/insights/vehicle]', err);
    res.status(500).json({ error: 'Failed to fetch vehicle insights' });
  }
});

export default router;
