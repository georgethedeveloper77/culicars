// apps/api/src/routes/watchMap.ts
// Serves approved alert pins for the public watch map.
// Mount in app.ts: app.use('/watch/map', watchMapRouter);

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { notifyNearbyUsers } from '../services/notificationService';

const router = Router();
const prisma = new PrismaClient();

// GET /watch/map/pins?lat=&lng=&radius=&type=
// Public — no auth required. Returns approved alert pins.
router.get('/pins', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(String(req.query.lat ?? ''));
    const lng = parseFloat(String(req.query.lng ?? ''));
    const radiusKm = parseFloat(String(req.query.radius ?? '10'));
    const type = req.query.type as string | undefined;

    const where: Record<string, unknown> = { status: 'approved' };
    if (type) where.type = type;

    // If lat/lng provided, filter by bounding box (fast approximation)
    if (!isNaN(lat) && !isNaN(lng)) {
      const deg = radiusKm / 111;
      where.lat = { gte: lat - deg, lte: lat + deg };
      where.lng = { gte: lng - deg, lte: lng + deg };
    }

    const alerts = await (prisma as any).watchAlert.findMany({
      where,
      select: {
        id: true,
        plate: true,
        type: true,
        lat: true,
        lng: true,
        description: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    res.json({ pins: alerts });
  } catch (err) {
    console.error('[GET /watch/map/pins]', err);
    res.status(500).json({ error: 'Failed to fetch map pins' });
  }
});

// GET /watch/map/pins/:id — single alert detail for bottom sheet
router.get('/pins/:id', async (req: Request, res: Response) => {
  try {
    const alert = await (prisma as any).watchAlert.findFirst({
      where: { id: req.params.id, status: 'approved' },
      select: {
        id: true,
        plate: true,
        vin: true,
        type: true,
        lat: true,
        lng: true,
        description: true,
        createdAt: true,
      },
    });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json({ alert });
  } catch (err) {
    console.error('[GET /watch/map/pins/:id]', err);
    res.status(500).json({ error: 'Failed to fetch alert detail' });
  }
});

export default router;
