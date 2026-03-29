// apps/api/src/routes/payments.ts

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getEnabledProviders, getCreditPacks, getPackById } from '../services/paymentConfigService';
import { recordPendingPurchase, getBalance, deductForUnlock } from '../services/creditService';
import { initiateStkPush } from '../services/providers/mpesa';
import { createPaymentIntent } from '../services/providers/stripe';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── GET /payments/providers?platform=web|app ──────────────────────────────
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const platform = (req.query.platform as string) === 'app' ? 'app' : 'web';
    const providers = await getEnabledProviders(platform);
    res.json({ providers });
  } catch (err) {
    console.error('[payments] providers error', err);
    res.status(500).json({ error: 'Failed to load payment providers' });
  }
});

// ─── GET /payments/packs?platform=web|app ──────────────────────────────────
router.get('/packs', async (req: Request, res: Response) => {
  try {
    const platform = (req.query.platform as string) === 'app' ? 'app' : 'web';
    const packs = await getCreditPacks(platform);
    res.json({ packs });
  } catch (err) {
    console.error('[payments] packs error', err);
    res.status(500).json({ error: 'Failed to load credit packs' });
  }
});

// ─── GET /credits/balance ──────────────────────────────────────────────────
router.get('/balance', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const balance = await getBalance(userId);
    res.json({ balance });
  } catch (err) {
    console.error('[payments] balance error', err);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// ─── POST /payments/mpesa/stk-push ────────────────────────────────────────
router.post('/mpesa/stk-push', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const { phone, pack_id, platform } = req.body as {
      phone: string;
      pack_id: string;
      platform: 'web' | 'app';
    };

    if (!phone || !pack_id) {
      return res.status(400).json({ error: 'phone and pack_id are required' });
    }

    const pack = await getPackById(pack_id, platform ?? 'web');
    if (!pack) return res.status(400).json({ error: 'Invalid pack_id' });

    // Record pending before calling provider — prevents lost credits on crash
    const providerRef = `mpesa_pending_${userId}_${pack_id}_${Date.now()}`;
    await recordPendingPurchase({
      userId,
      packId: pack_id,
      provider: 'mpesa',
      providerRef,
      credits: pack.credits,
      meta: { price_kes: pack.price_kes, phone },
    });

    const result = await initiateStkPush({
      phone,
      amountKes: pack.price_kes,
      accountRef: `CULICARS-${pack_id.toUpperCase()}`,
      description: `CuliCars ${pack.label} pack`,
      providerRef,
    });

    // Update the pending record with the real checkout_request_id
    await (prisma as any).credit_transactions.updateMany({
      where: { provider_ref: providerRef },
      data: { provider_ref: result.checkoutRequestId },
    });

    res.json({
      checkout_request_id: result.checkoutRequestId,
      message: 'STK push sent — enter your M-Pesa PIN to complete payment.',
    });
  } catch (err: any) {
    console.error('[payments] mpesa stk error', err);
    res.status(500).json({ error: err?.message ?? 'M-Pesa payment failed' });
  }
});

// ─── POST /payments/stripe/create-intent ──────────────────────────────────
router.post('/stripe/create-intent', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const { pack_id, platform } = req.body as { pack_id: string; platform: 'web' | 'app' };

    if (!pack_id) return res.status(400).json({ error: 'pack_id is required' });

    const pack = await getPackById(pack_id, platform ?? 'web');
    if (!pack) return res.status(400).json({ error: 'Invalid pack_id' });

    const amountCents = pack.price_usd * 100;

    const { clientSecret, intentId } = await createPaymentIntent({
      amountUsdCents: amountCents,
      metadata: { userId, packId: pack_id, credits: String(pack.credits) },
    });

    // Record pending — confirmed via Stripe webhook
    await recordPendingPurchase({
      userId,
      packId: pack_id,
      provider: 'stripe',
      providerRef: intentId,
      credits: pack.credits,
      meta: { price_usd: pack.price_usd },
    });

    res.json({ client_secret: clientSecret, amount_usd_cents: amountCents });
  } catch (err: any) {
    console.error('[payments] stripe intent error', err);
    res.status(500).json({ error: err?.message ?? 'Stripe payment failed' });
  }
});

// ─── POST /reports/:id/unlock ──────────────────────────────────────────────
router.post('/reports/:id/unlock', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string;
    const reportId = req.params.id;

    // Check if already unlocked (idempotent)
    const existing = await (prisma as any).report_unlock.findFirst({
      where: { user_id: userId, report_id: reportId },
    });

    if (existing) {
      const balance = await getBalance(userId);
      return res.json({ unlocked: true, credits_remaining: balance, report_id: reportId });
    }

    // Deduct 1 credit
    const { success, newBalance } = await deductForUnlock(userId, reportId, 1);

    if (!success) {
      return res.status(402).json({ error: 'Insufficient credits', credits_remaining: newBalance });
    }

    // Record the unlock access
    await (prisma as any).report_unlock.upsert({
      where: { user_id_report_id: { user_id: userId, report_id: reportId } },
      create: { user_id: userId, report_id: reportId },
      update: {},
    });

    res.json({ unlocked: true, credits_remaining: newBalance, report_id: reportId });
  } catch (err) {
    console.error('[payments] unlock error', err);
    res.status(500).json({ error: 'Unlock failed' });
  }
});

export default router;
