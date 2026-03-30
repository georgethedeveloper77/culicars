// apps/api/src/routes/webhooks/mpesa.ts

import { Router, Request, Response } from 'express';
import { parseStkCallback } from '../../services/providers/mpesa';
import { confirmPayment } from '../../services/creditService';

const router: import("express").Router = Router();

/**
 * POST /webhooks/mpesa
 * Safaricom STK Push callback.
 * Must be publicly accessible (no auth middleware) and respond quickly.
 * Mount this BEFORE express.json() is irrelevant for M-Pesa (it sends JSON),
 * but keep it separate from the Stripe raw-body requirement.
 */
router.post('/', async (req: Request, res: Response) => {
  // Always ACK Safaricom immediately — they retry on non-200
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const parsed = parseStkCallback(req.body);

    if (!parsed.success) {
      console.warn(`[webhook/mpesa] STK failed: ${parsed.checkoutRequestId}`);
      return;
    }

    const result = await confirmPayment(parsed.checkoutRequestId);

    if (!result) {
      console.warn(`[webhook/mpesa] No pending tx for: ${parsed.checkoutRequestId}`);
      return;
    }

    console.log(
      `[webhook/mpesa] Confirmed ${result.credits} credits for user ${result.user_id} ` +
      `(receipt: ${parsed.mpesaReceiptNumber})`
    );
  } catch (err) {
    // Log but never let the webhook handler throw — we already ACK'd
    console.error('[webhook/mpesa] Handler error:', err);
  }
});

export default router;
