// ============================================================
// CuliCars — Thread 6: M-Pesa Webhook
// ============================================================
// POST /webhooks/mpesa — Daraja STK Push callback
// Called by Safaricom after user confirms/cancels on phone.
// ResultCode 0 = success, anything else = failure.
// ============================================================

import { Router } from 'express';
import { confirmPayment, failPayment } from '../../services/paymentProviderService';
import type { MpesaCallbackBody } from '../../types/payment.types';

const router: import("express").Router = Router();

// M-Pesa sends JSON callbacks — no auth header, we validate by structure
router.post('/', async (req, res) => {
  // Always respond 200 to M-Pesa immediately — they retry on non-200
  try {
    const body = req.body as MpesaCallbackBody;

    const callback = body?.Body?.stkCallback;
    if (!callback) {
      console.warn('[M-Pesa Webhook] Invalid callback body — no stkCallback');
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const {
      CheckoutRequestID: checkoutId,
      MerchantRequestID: merchantId,
      ResultCode: resultCode,
      ResultDesc: resultDesc,
      CallbackMetadata: metadata,
    } = callback;

    console.info(
      `[M-Pesa Webhook] CheckoutID=${checkoutId} Result=${resultCode} Desc=${resultDesc}`
    );

    if (resultCode === 0) {
      // ── SUCCESS ──
      // Extract metadata items
      const metaItems = metadata?.Item ?? [];
      const metaMap: Record<string, string | number | undefined> = {};
      for (const item of metaItems) {
        metaMap[item.Name] = item.Value;
      }

      await confirmPayment(checkoutId, {
        merchantRequestId: merchantId,
        resultCode,
        resultDesc,
        mpesaReceiptNumber: metaMap['MpesaReceiptNumber'],
        amount: metaMap['Amount'],
        phoneNumber: metaMap['PhoneNumber'],
        transactionDate: metaMap['TransactionDate'],
      });

      console.info(
        `[M-Pesa Webhook] Payment confirmed. Receipt=${metaMap['MpesaReceiptNumber']}`
      );
    } else {
      // ── FAILURE ──
      // Common codes: 1032=cancelled, 1037=timeout, 1=insufficient balance
      await failPayment(checkoutId, `ResultCode ${resultCode}: ${resultDesc}`);

      console.info(
        `[M-Pesa Webhook] Payment failed. Code=${resultCode} Desc=${resultDesc}`
      );
    }
  } catch (err) {
    // Log but still return 200 — don't let M-Pesa retry
    console.error('[M-Pesa Webhook] Processing error:', err);
  }

  // Always respond 200 to Safaricom
  return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

export default router;
