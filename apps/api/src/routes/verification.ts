// apps/api/src/routes/verification.ts

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth';
import {
  initiateVerification,
  attemptLiveFetch,
  processCORUpload,
  getVerificationStatus,
} from '../services/verificationService';

const router: ReturnType<typeof Router> = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * POST /verify/initiate
 * Start a verification session for a plate + user.
 */
router.post('/initiate', auth, async (req: Request, res: Response) => {
  const { plate, vin } = req.body;
  if (!plate) return res.status(400).json({ error: 'plate is required' });

  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const result = await initiateVerification(userId, plate.toUpperCase(), vin);
  return res.json(result);
});

/**
 * POST /verify/:verificationId/live
 * Attempt live NTSA fetch. Returns manual_required if disabled or unavailable.
 */
router.post('/:verificationId/live', auth, async (req: Request, res: Response) => {
  const { verificationId } = req.params;
  const { plate } = req.body;
  if (!plate) return res.status(400).json({ error: 'plate is required' });

  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const result = await attemptLiveFetch(verificationId, plate.toUpperCase());
  return res.json(result);
});

/**
 * POST /verify/:verificationId/upload
 * Accept COR PDF upload. Parses, discards PII, stores safe fields.
 */
router.post(
  '/:verificationId/upload',
  auth,
  upload.single('cor_pdf'),
  async (req: Request, res: Response) => {
    const { verificationId } = req.params;
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const result = await processCORUpload(verificationId, req.file.buffer, userId);

    if (!result.success) {
      return res.status(422).json(result);
    }

    return res.json(result);
  }
);

/**
 * GET /verify/status?plate=
 * Check whether user has a completed verification for a plate.
 */
router.get('/status', auth, async (req: Request, res: Response) => {
  const { plate } = req.query as { plate?: string };
  if (!plate) return res.status(400).json({ error: 'plate is required' });

  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const status = await getVerificationStatus(userId, plate.toUpperCase());
  return res.json(status);
});

export default router;
