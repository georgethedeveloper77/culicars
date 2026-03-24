"use strict";
// ============================================================
// CuliCars — Thread 6: Payments Route
// ============================================================
// GET  /payments/providers    — list enabled providers
// GET  /payments/packs        — credit pack options
// POST /payments/initiate     — start a payment
// GET  /payments/:id/status   — check payment status
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const creditPacks_1 = require("../config/creditPacks");
const paymentProviderService_1 = require("../services/paymentProviderService");
const router = (0, express_1.Router)();
// ── GET /payments/providers ─────────────────────────────────
// Public: returns only enabled providers so frontend renders dynamically
router.get('/providers', async (_req, res, next) => {
    try {
        const providers = await (0, paymentProviderService_1.getEnabledProviders)();
        return res.json({
            success: true,
            data: providers,
        });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /payments/packs ─────────────────────────────────────
// Public: returns all credit packs with KES + USD prices.
// Frontend displays KES by default, switches to USD for PayPal/Stripe.
router.get('/packs', (_req, res) => {
    return res.json({
        success: true,
        data: (0, creditPacks_1.formatPacksForResponse)(),
    });
});
// ── POST /payments/initiate ─────────────────────────────────
// Auth required. Starts a payment flow.
const initiateSchema = zod_1.z.object({
    packId: zod_1.z.string().min(1),
    provider: zod_1.z.enum(['mpesa', 'paypal', 'stripe', 'revenuecat', 'card']),
    phone: zod_1.z.string().optional(), // required for mpesa
    returnUrl: zod_1.z.string().url().optional(),
    cancelUrl: zod_1.z.string().url().optional(),
});
router.post('/initiate', auth_1.auth, async (req, res, next) => {
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
        const userId = req.user.id;
        // Validate phone for M-Pesa
        if (provider === 'mpesa' && !phone) {
            return res.status(400).json({
                error: 'PHONE_REQUIRED',
                message: 'Phone number is required for M-Pesa payments',
                statusCode: 400,
            });
        }
        // Validate pack exists
        const pack = (0, creditPacks_1.getPackById)(packId);
        if (!pack) {
            return res.status(400).json({
                error: 'INVALID_PACK',
                message: `Credit pack '${packId}' not found`,
                statusCode: 400,
            });
        }
        const result = await (0, paymentProviderService_1.initiatePayment)({
            userId,
            packId,
            provider: provider,
            phone,
            returnUrl,
            cancelUrl,
        });
        // Include price info in response so frontend can display
        const { amount, currency } = (0, creditPacks_1.getPackPrice)(pack, provider);
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
                    display: currency === 'KES'
                        ? `KSh ${amount.toLocaleString()}`
                        : `$${amount.toFixed(2)}`,
                },
            },
        });
    }
    catch (err) {
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
router.get('/:id/status', auth_1.auth, async (req, res, next) => {
    try {
        const payment = await (0, paymentProviderService_1.getPaymentById)(req.params.id);
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
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
