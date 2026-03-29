// apps/api/src/routes/payments.ts

import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { optionalAuth } from '../middleware/optionalAuth';
import {
  getEnabledProviders,
  initiatePayment,
  confirmPayment,
} from '../services/paymentProviderService';
import {
  getEnabledProvidersForPlatform,
  getCreditPacks,
} from '../services/adminConfigService';

const router: Router = Router();

// ─── Config-driven endpoints (T5) ─────────────────────────────────────────

// GET /payments/providers?platform=web|app
// Returns the admin-configured provider list for the given platform.
// Used by web and mobile frontends to know which payment buttons to show.
router.get('/providers', async (req: Request, res: Response) => {
  const platform = req.query.platform as string;
  if (!platform || !['web', 'app'].includes(platform)) {
    return res.status(400).json({ error: 'platform must be "web" or "app"' });
  }

  try {
    const providers = await getEnabledProvidersForPlatform(
      platform as 'web' | 'app',
    );
    return res.json({ platform, providers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /payments/packs?platform=web|app
// Returns credit pack options for the given platform.
// Web packs include price_kes + price_usd. App packs include price_usd only.
router.get('/packs', async (req: Request, res: Response) => {
  const platform = req.query.platform as string;
  if (!platform || !['web', 'app'].includes(platform)) {
    return res.status(400).json({ error: 'platform must be "web" or "app"' });
  }

  try {
    const packs = await getCreditPacks(platform as 'web' | 'app');
    return res.json({ platform, packs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── Payment initiation (T6) ──────────────────────────────────────────────

// GET /payments/enabled-providers
// Returns DB-driven enabled providers with adapter info (used internally).
router.get('/enabled-providers', optionalAuth, async (_req: Request, res: Response) => {
  try {
    const providers = await getEnabledProviders();
    return res.json({ providers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /payments/initiate
// Initiates a payment for a credit pack purchase.
router.post('/initiate', auth, async (req: Request, res: Response) => {
  try {
    const userId: string = (req as any).user.id;
    const { provider, packId, phone } = req.body;

    if (!provider || !packId) {
      return res.status(400).json({ error: 'provider and packId are required' });
    }

    const result = await initiatePayment({
      userId,
      provider: provider,
      packId,
      phone,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
