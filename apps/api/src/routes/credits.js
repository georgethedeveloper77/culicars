"use strict";
// ============================================================
// CuliCars — Thread 6: Credits Route
// ============================================================
// GET /credits/balance   — current wallet balance
// GET /credits/ledger    — paginated credit history
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const walletService_1 = require("../services/walletService");
const ledgerService_1 = require("../services/ledgerService");
const router = (0, express_1.Router)();
// ── GET /credits/balance ────────────────────────────────────
router.get('/balance', auth_1.auth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const wallet = await (0, walletService_1.getOrCreateWallet)(userId);
        return res.json({
            success: true,
            data: {
                balance: wallet.balance,
                updatedAt: wallet.updatedAt,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// ── GET /credits/ledger ─────────────────────────────────────
const ledgerQuerySchema = zod_1.z.object({
    limit: zod_1.z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 50))
        .pipe(zod_1.z.number().int().min(1).max(100)),
    offset: zod_1.z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 0))
        .pipe(zod_1.z.number().int().min(0)),
});
router.get('/ledger', auth_1.auth, async (req, res, next) => {
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
        const userId = req.user.id;
        const { limit, offset } = parsed.data;
        const result = await (0, ledgerService_1.getUserLedger)(userId, { limit, offset });
        return res.json({
            success: true,
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
