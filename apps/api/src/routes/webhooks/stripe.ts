// apps/api/src/routes/webhooks/stripe.ts

import { Router, Request, Response } from 'express';
import { parseWebhookEvent } from '../../services/providers/stripe';
import { confirmPayment } from '../../services/creditService';

const router = Router();

/**
 * POST /webhooks/stripe
 * CRITICAL: This route must be mounted in app.ts BEFORE express.json()
 * so the raw Buffer body is preserved for HMAC verification.
 * Use express.raw({ type: 'application/json' }) on this route only.
 */
router.post('/', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;
  try {
    event = parseWebhookEvent(req.body as Buffer, sig);
  } catch (err: any) {
    console.error('[webhook/stripe] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook verification failed: ${err.message}` });
  }

  // ACK immediately — Stripe retries on non-2xx
  res.status(200).json({ received: true });

  try {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as any;
      const intentId: string = intent.id;

      const result = await confirmPayment(intentId);

      if (!result) {
        console.warn(`[webhook/stripe] No pending tx for intent: ${intentId}`);
        return;
      }

      console.log(
        `[webhook/stripe] Confirmed ${result.credits} credits for user ${result.userId} ` +
        `(intent: ${intentId})`
      );
    } else {
      // Log other event types but don't fail
      console.log(`[webhook/stripe] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('[webhook/stripe] Handler error:', err);
  }
});

export default router;
