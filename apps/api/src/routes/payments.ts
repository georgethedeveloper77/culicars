// ============================================================
// CuliCars — Thread 6: Payments Route
// ============================================================
// GET  /payments/providers    — list enabled providers
// GET  /payments/packs        — credit pack options
// POST /payments/initiate     — start a payment
// GET  /payments/:id/status   — check payment status
// ============================================================

import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth';
import { formatPacksForResponse, getPackById, getPackPrice } from '../config/creditPacks';
import {
  getEnabledProviders,
  initiatePayment,
  getPaymentById,
} from '../services/paymentProviderService';
import type { ProviderSlug } from '../types/payment.types';

const router = Router();

// ── GET /payments/providers ─────────────────────────────────
// Public: returns only enabled providers so frontend renders dynamically
router.get('/providers', async (_req, res, next) => {
  try {
    const providers = await getEnabledProviders();
    return res.json({
      success: true,
      data: providers,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /payments/packs ─────────────────────────────────────
// Public: returns all credit packs with KES + USD prices.
// Frontend displays KES by default, switches to USD for PayPal/Stripe.
router.get('/packs', (_req, res) => {
  return res.json({
    success: true,
    data: formatPacksForResponse(),
  });
});

// ── POST /payments/initiate ─────────────────────────────────
// Auth required. Starts a payment flow.
const initiateSchema = z.object({
  packId: z.string().min(1),
  provider: z.enum(['mpesa', 'paypal', 'stripe', 'revenuecat', 'card']),
  phone: z.string().optional(),        // required for mpesa
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

router.post('/initiate', auth, async (req, res, next) => {
  try {
    const parsed = initiateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid payment request',
        details: parsed.error.flatten(),
        statusCode: 400,
      });
    }

    const { packId, provider, phone, returnUrl, cancelUrl } = parsed.data;
    const userId = req.user!.id;

    // Validate phone for M-Pesa
    if (provider === 'mpesa' && !phone) {
      return res.status(400).json({
        error: 'PHONE_REQUIRED',
        message: 'Phone number is required for M-Pesa payments',
        statusCode: 400,
      });
    }

    // Validate pack exists
    const pack = getPackById(packId);
    if (!pack) {
      return res.status(400).json({
        error: 'INVALID_PACK',
        message: `Credit pack '${packId}' not found`,
        statusCode: 400,
      });
    }

    const result = await initiatePayment({
      userId,
      packId,
      provider: provider as ProviderSlug,
      phone,
      returnUrl,
      cancelUrl,
    });

    // Include price info in response so frontend can display
    const { amount, currency } = getPackPrice(pack, provider);

    return res.status(201).json({
      success: true,
      data: {
        ...result,
        pack: {
          id: pack.id,
          credits: pack.credits,
          label: pack.label,
        },
        price: {
          amount,
          currency,
          display:
            currency === 'KES'
              ? `KSh ${amount.toLocaleString()}`
              : `$${amount.toFixed(2)}`,
        },
      },
    });
  } catch (err: any) {
    if (err.message?.includes('not available')) {
      return res.status(400).json({
        error: 'PROVIDER_UNAVAILABLE',
        message: err.message,
        statusCode: 400,
      });
    }
    next(err);
  }
});

// ── GET /payments/:id/status ────────────────────────────────
// Auth required. Poll payment status.
router.get('/:id/status', auth, async (req, res, next) => {
  try {
    const payment = await getPaymentById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Payment not found',
        statusCode: 404,
      });
    }

    return res.json({
      success: true,
      data: payment,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
