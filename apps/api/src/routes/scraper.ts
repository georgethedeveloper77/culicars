// apps/api/src/routes/scraper.ts

import { Router, Request, Response, IRouter } from 'express';
import { auth } from '../middleware/auth';
import { processVehicleQuery } from '../processors/rawDataProcessor';
import { enqueue } from '../services/searchDemandQueueService';

// TODO: replace with your actual auth middleware exports from ../middleware/auth
// e.g. import { authenticateToken } from '../middleware/auth';
// then add authenticateToken as the second argument on protected routes

const router: IRouter = Router();

/**
 * POST /scraper/process
 * Run the full data pipeline for a VIN or plate.
 * Returns a merged vehicle record + result state — never an empty 200.
 */
router.post('/process', auth, async (req: Request, res: Response) => {
  const { vin, plate } = req.body as { vin?: string; plate?: string };

  if (!vin && !plate) {
    return res.status(400).json({ success: false, error: 'Provide vin or plate' });
  }

  try {
    const result = await processVehicleQuery({ vin, plate });

    if (result.shouldQueue) {
      enqueue({
        vin:   result.merged.vin   ?? vin,
        plate: result.merged.plate ?? plate,
        resultState: result.merged.resultState,
      }).catch((err) =>
        console.error(JSON.stringify({ msg: 'scraper/process: enqueue side-effect failed', err: String(err) })),
      );
    }

    return res.json({
      success: true,
      data: {
        vehicle:     result.merged,
        sourceCount: result.records.length,
        resultState: result.merged.resultState,
        queued:      result.shouldQueue,
      },
    });
  } catch (err) {
    console.error(JSON.stringify({ msg: 'scraper/process: unhandled error', err: String(err), vin, plate }));
    return res.status(500).json({ success: false, error: 'Processing failed' });
  }
});

/**
 * GET /scraper/result-states
 */
router.get('/result-states', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: ['verified', 'partial', 'low_confidence', 'pending_enrichment'],
  });
});

export default router;
