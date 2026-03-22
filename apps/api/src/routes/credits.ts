// ============================================================
// CuliCars — Thread 6: Credits Route
// ============================================================
// GET /credits/balance   — current wallet balance
// GET /credits/ledger    — paginated credit history
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { getOrCreateWallet } from '../services/walletService';
import { getUserLedger } from '../services/ledgerService';

const router = Router();

// ── GET /credits/balance ────────────────────────────────────
router.get('/balance', auth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const wallet = await getOrCreateWallet(userId);

    return res.json({
      success: true,
      data: {
        balance: wallet.balance,
        updatedAt: wallet.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /credits/ledger ─────────────────────────────────────
const ledgerQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 0))
    .pipe(z.number().int().min(0)),
});

router.get('/ledger', auth, async (req, res, next) => {
  try {
    const parsed = ledgerQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: parsed.error.flatten(),
        statusCode: 400,
      });
    }

    const userId = req.user!.id;
    const { limit, offset } = parsed.data;
    const result = await getUserLedger(userId, { limit, offset });

    return res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
