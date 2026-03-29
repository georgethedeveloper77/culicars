// apps/api/src/routes/payments.ts
// ADD these two endpoints to your existing payments router.
// Import getEnabledProviders and getCreditPacks at the top of the file alongside your existing imports:
//
//   import { getEnabledProviders, getCreditPacks } from '../services/adminConfigService';
//
// Then add the two route handlers below into the existing router.

// GET /payments/providers?platform=web|app
router.get('/providers', async (req: Request, res: Response) => {
  const platform = req.query.platform as 'web' | 'app';
  if (!platform || !['web', 'app'].includes(platform)) {
    return res.status(400).json({ error: 'platform must be "web" or "app"' });
  }

  try {
    const providers = await getEnabledProviders(platform);
    return res.json({ platform, providers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /payments/packs?platform=web|app
router.get('/packs', async (req: Request, res: Response) => {
  const platform = req.query.platform as 'web' | 'app';
  if (!platform || !['web', 'app'].includes(platform)) {
    return res.status(400).json({ error: 'platform must be "web" or "app"' });
  }

  try {
    const packs = await getCreditPacks(platform);
    return res.json({ platform, packs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
