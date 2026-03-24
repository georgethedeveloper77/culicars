// ============================================================
// CuliCars — Thread 6: RevenueCat Webhook
// ============================================================
// POST /webhooks/revenuecat — handles Apple IAP + Google Play
// RevenueCat sends a single webhook for both stores.
// Key events: INITIAL_PURCHASE, NON_RENEWING_PURCHASE
// (CuliCars uses consumables, not subscriptions)
// ============================================================

import { Router } from 'express';
import { env } from '../../config/env';
import { resolveProductToPack } from '../../services/providers/revenuecatProvider';
import { confirmPayment, getPaymentByRef } from '../../services/paymentProviderService';
import { grantCredits } from '../../services/creditService';
import prisma from '../../lib/prisma';
import type { RevenuecatWebhookBody } from '../../types/payment.types';

const router: import("express").Router = Router();

/**
 * Verify RevenueCat webhook authorization.
 * RevenueCat sends a shared secret in the Authorization header.
 */
function verifyRevenuecatAuth(authHeader: string | undefined): boolean {
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === env.REVENUECAT_WEBHOOK_SECRET;
}

router.post('/', async (req, res) => {
  try {
    // 1. Verify auth
    const authHeader = req.headers.authorization;
    if (!verifyRevenuecatAuth(authHeader)) {
      console.warn('[RevenueCat Webhook] Invalid authorization');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body = req.body as RevenuecatWebhookBody;
    const { event } = body;

    console.info(
      `[RevenueCat Webhook] Event: ${event.type} Product: ${event.product_id} ` +
      `Store: ${event.store} User: ${event.app_user_id}`
    );

    // 2. Only process purchase events for consumables
    const purchaseEvents = [
      'INITIAL_PURCHASE',
      'NON_RENEWING_PURCHASE',
      'PRODUCT_CHANGE',
    ];

    if (!purchaseEvents.includes(event.type)) {
      console.info(`[RevenueCat Webhook] Skipping event type: ${event.type}`);
      return res.json({ received: true });
    }

    // 3. Resolve product → credit pack
    const pack = resolveProductToPack(event.product_id);
    if (!pack) {
      console.warn(
        `[RevenueCat Webhook] Unknown product: ${event.product_id}. Skipping.`
      );
      return res.json({ received: true });
    }

    // 4. Idempotency: check if transaction already processed
    const txRef = `rc_${event.transaction_id}`;
    const existingLedger = await prisma.creditLedger.findFirst({
      where: { txRef },
    });

    if (existingLedger) {
      console.info(
        `[RevenueCat Webhook] Transaction ${event.transaction_id} already processed. Skipping.`
      );
      return res.json({ received: true });
    }

    // 5. Find or create user by app_user_id
    //    RevenueCat app_user_id should match our Supabase user ID
    const userId = event.app_user_id;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      console.error(
        `[RevenueCat Webhook] User not found: ${userId}. Cannot grant credits.`
      );
      return res.status(200).json({ received: true, warning: 'User not found' });
    }

    // 6. Create payment record + grant credits
    const payment = await prisma.payment.create({
      data: {
        userId,
        provider: 'revenuecat',
        amount: Math.round(event.price_in_purchased_currency * 100),
        currency: event.currency || 'USD',
        credits: pack.credits,
        status: 'success',
        providerRef: txRef,
        providerMeta: {
          store: event.store,
          transactionId: event.transaction_id,
          productId: event.product_id,
          eventType: event.type,
          eventId: event.id,
        },
        updatedAt: new Date(),
      },
    });

    // 7. Grant credits atomically
    const newBalance = await grantCredits({
      userId,
      credits: pack.credits,
      type: 'purchase',
      source: `revenuecat_${event.store.toLowerCase()}_purchase`,
      txRef,
      metadata: {
        paymentId: payment.id,
        store: event.store,
        productId: event.product_id,
        transactionId: event.transaction_id,
      },
    });

    console.info(
      `[RevenueCat Webhook] Granted ${pack.credits} credits to ${userId}. ` +
      `Balance: ${newBalance}. Store: ${event.store}`
    );

    return res.json({ received: true });
  } catch (err) {
    console.error('[RevenueCat Webhook] Processing error:', err);
    // Still return 200 to prevent RevenueCat from retrying endlessly
    return res.status(200).json({ received: true, error: 'Processing failed' });
  }
});

export default router;
