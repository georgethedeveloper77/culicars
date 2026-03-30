// apps/api/src/routes/userVehicles.ts

import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import {
  getUserVehicles,
  addUserVehicle,
  updateUserVehicle,
  removeUserVehicle,
  updatePreferredLocation,
  getPreferredLocation,
  RelationshipType,
} from '../services/userVehiclesService';

const router: ReturnType<typeof Router> = Router();

// All routes require auth
router.use(auth);

// ── GET /user/vehicles ────────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const vehicles = await getUserVehicles(userId);
    res.json({ vehicles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /user/vehicles ───────────────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const { plate, vin, relationshipType, nickname, alertRadiusKm } = req.body;

    if (!relationshipType) {
      return res.status(400).json({ error: 'relationshipType is required' });
    }

    const allowed: RelationshipType[] = ['owner', 'driver', 'tracker', 'watchlist'];
    if (!allowed.includes(relationshipType)) {
      return res.status(400).json({
        error: `relationshipType must be one of: ${allowed.join(', ')}`,
      });
    }

    const vehicle = await addUserVehicle(userId, {
      plate,
      vin,
      relationshipType,
      nickname,
      alertRadiusKm: alertRadiusKm ? Number(alertRadiusKm) : undefined,
    });

    res.status(201).json({ vehicle });
  } catch (err: any) {
    if (err.message === 'This vehicle is already in your list') {
      return res.status(409).json({ error: err.message });
    }
    if (err.message === 'At least one of plate or VIN is required') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /user/vehicles/:id ──────────────────────────────────────────────────
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const { id } = req.params;
    const { nickname, alertRadiusKm, relationshipType } = req.body;

    const updated = await updateUserVehicle(userId, id, {
      nickname,
      alertRadiusKm: alertRadiusKm !== undefined ? Number(alertRadiusKm) : undefined,
      relationshipType,
    });

    res.json({ vehicle: updated });
  } catch (err: any) {
    if (err.message === 'Vehicle not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /user/vehicles/:id ─────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const { id } = req.params;
    const result = await removeUserVehicle(userId, id);
    res.json(result);
  } catch (err: any) {
    if (err.message === 'Vehicle not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── GET /user/vehicles/preferred-location ────────────────────────────────────
router.get('/preferred-location', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const location = await getPreferredLocation(userId);
    res.json({ location });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /user/vehicles/preferred-location ───────────────────────────────────
router.post('/preferred-location', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const { lat, lng, locationName } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const profile = await updatePreferredLocation(userId, {
      lat: Number(lat),
      lng: Number(lng),
      locationName,
    });

    res.json({ location: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
