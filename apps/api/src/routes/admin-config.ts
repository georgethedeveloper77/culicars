// apps/api/src/routes/admin-config.ts

import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  getAllConfig,
  getConfig,
  setConfig,
} from '../services/adminConfigService';
import type { AdminConfigKey } from '@culicars/types';

const router = Router();

// All admin-config routes require admin role
router.use(requireAuth, requireRole('admin'));

// GET /admin/config — full config dump for admin UI
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await getAllConfig();
    return res.json({ config: rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /admin/config/:key — single key
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const key = req.params.key as AdminConfigKey;
    const value = await getConfig(key);
    return res.json({ key, value });
  } catch (err: any) {
    const status = err.message.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: err.message });
  }
});

// PATCH /admin/config/:key — update a single config key
router.patch('/:key', async (req: Request, res: Response) => {
  try {
    const key = req.params.key as AdminConfigKey;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: '`value` is required' });
    }

    const adminId: string = (req as any).user.id;
    const updated = await setConfig(key, value, adminId);

    return res.json({ config: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
