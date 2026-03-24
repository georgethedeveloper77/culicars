"use strict";
// ============================================================
// CuliCars — Thread 6: Payment Provider Service Tests (FIXED)
// ============================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Hoisted mocks — self-contained factories
vitest_1.vi.mock('../lib/prisma', () => ({
    default: {
        paymentProvider: {
            findMany: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
        },
        payment: {
            create: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
            findFirst: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
        },
        creditLedger: {
            findFirst: vitest_1.vi.fn(),
            create: vitest_1.vi.fn(),
        },
        wallet: {
            findUnique: vitest_1.vi.fn(),
            upsert: vitest_1.vi.fn(),
        },
        $transaction: vitest_1.vi.fn(async (fn) => {
            const { default: p } = await Promise.resolve().then(() => __importStar(require('../lib/prisma')));
            return fn(p);
        }),
    },
}));
// Mock credit service to avoid nested transaction issues in tests
vitest_1.vi.mock('../services/creditService', () => ({
    grantCredits: vitest_1.vi.fn().mockResolvedValue(10),
}));
const prisma_1 = __importDefault(require("../lib/prisma"));
const paymentProviderService_1 = require("../services/paymentProviderService");
const mockProviders = vitest_1.vi.mocked(prisma_1.default.paymentProvider);
const mockPayment = vitest_1.vi.mocked(prisma_1.default.payment);
// Create a mock provider adapter
const mockAdapter = {
    slug: 'mpesa',
    initiate: vitest_1.vi.fn().mockResolvedValue({
        providerRef: 'mpesa-ref-123',
        providerData: { checkoutRequestId: 'mpesa-ref-123' },
    }),
    verify: vitest_1.vi.fn().mockResolvedValue({ status: 'success' }),
};
(0, vitest_1.describe)('paymentProviderService', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        // Re-register after clearing
        (0, paymentProviderService_1.registerProvider)(mockAdapter);
    });
    (0, vitest_1.describe)('getEnabledProviders', () => {
        (0, vitest_1.it)('returns only enabled providers with registered adapters', async () => {
            mockProviders.findMany.mockResolvedValue([
                { id: '1', name: 'M-Pesa', slug: 'mpesa', isEnabled: true },
                { id: '2', name: 'PayPal', slug: 'paypal', isEnabled: true },
            ]);
            const providers = await (0, paymentProviderService_1.getEnabledProviders)();
            // Only mpesa has a registered adapter in this test
            (0, vitest_1.expect)(providers).toHaveLength(1);
            (0, vitest_1.expect)(providers[0].slug).toBe('mpesa');
        });
        (0, vitest_1.it)('returns empty array when no providers enabled', async () => {
            mockProviders.findMany.mockResolvedValue([]);
            const providers = await (0, paymentProviderService_1.getEnabledProviders)();
            (0, vitest_1.expect)(providers).toHaveLength(0);
        });
    });
    (0, vitest_1.describe)('isProviderEnabled', () => {
        (0, vitest_1.it)('returns true for enabled provider with adapter', async () => {
            mockProviders.findUnique.mockResolvedValue({ isEnabled: true });
            const result = await (0, paymentProviderService_1.isProviderEnabled)('mpesa');
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('returns false for disabled provider', async () => {
            mockProviders.findUnique.mockResolvedValue({ isEnabled: false });
            const result = await (0, paymentProviderService_1.isProviderEnabled)('mpesa');
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('returns false for non-existent provider', async () => {
            mockProviders.findUnique.mockResolvedValue(null);
            const result = await (0, paymentProviderService_1.isProviderEnabled)('mpesa');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('initiatePayment', () => {
        (0, vitest_1.it)('creates pending payment and calls provider', async () => {
            mockProviders.findUnique.mockResolvedValue({ isEnabled: true });
            mockPayment.create.mockResolvedValue({
                id: 'pay-1',
                userId: 'user-1',
                provider: 'mpesa',
                amount: 15000,
                currency: 'KES',
                credits: 1,
                status: 'pending',
            });
            mockPayment.update.mockResolvedValue({});
            const result = await (0, paymentProviderService_1.initiatePayment)({
                userId: 'user-1',
                packId: 'culicars_credits_1',
                provider: 'mpesa',
                phone: '0712345678',
            });
            (0, vitest_1.expect)(result.paymentId).toBe('pay-1');
            (0, vitest_1.expect)(result.provider).toBe('mpesa');
            (0, vitest_1.expect)(result.status).toBe('pending');
            (0, vitest_1.expect)(result.providerRef).toBe('mpesa-ref-123');
            (0, vitest_1.expect)(mockPayment.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                data: vitest_1.expect.objectContaining({
                    userId: 'user-1',
                    provider: 'mpesa',
                    currency: 'KES',
                    credits: 1,
                    status: 'pending',
                }),
            }));
        });
        (0, vitest_1.it)('throws on invalid pack ID', async () => {
            await (0, vitest_1.expect)((0, paymentProviderService_1.initiatePayment)({
                userId: 'user-1',
                packId: 'nonexistent_pack',
                provider: 'mpesa',
            })).rejects.toThrow('Invalid pack');
        });
        (0, vitest_1.it)('throws on disabled provider', async () => {
            mockProviders.findUnique.mockResolvedValue({ isEnabled: false });
            await (0, vitest_1.expect)((0, paymentProviderService_1.initiatePayment)({
                userId: 'user-1',
                packId: 'culicars_credits_1',
                provider: 'mpesa',
            })).rejects.toThrow('not available');
        });
        (0, vitest_1.it)('marks payment as failed if provider initiation fails', async () => {
            mockProviders.findUnique.mockResolvedValue({ isEnabled: true });
            mockPayment.create.mockResolvedValue({
                id: 'pay-fail',
                status: 'pending',
            });
            mockAdapter.initiate.mockRejectedValueOnce(new Error('Provider down'));
            mockPayment.update.mockResolvedValue({});
            await (0, vitest_1.expect)((0, paymentProviderService_1.initiatePayment)({
                userId: 'user-1',
                packId: 'culicars_credits_1',
                provider: 'mpesa',
                phone: '0712345678',
            })).rejects.toThrow('Provider down');
            (0, vitest_1.expect)(mockPayment.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                where: { id: 'pay-fail' },
                data: vitest_1.expect.objectContaining({ status: 'failed' }),
            }));
        });
    });
    (0, vitest_1.describe)('confirmPayment', () => {
        (0, vitest_1.it)('confirms pending payment and grants credits', async () => {
            mockPayment.findFirst.mockResolvedValue({
                id: 'pay-1',
                userId: 'user-1',
                provider: 'mpesa',
                amount: 15000,
                currency: 'KES',
                credits: 1,
                status: 'pending',
                providerRef: 'mpesa-ref-123',
            });
            mockPayment.update.mockResolvedValue({});
            const result = await (0, paymentProviderService_1.confirmPayment)('mpesa-ref-123', { receipt: 'ABC' });
            (0, vitest_1.expect)(result).not.toBeNull();
            (0, vitest_1.expect)(result.paymentId).toBe('pay-1');
            (0, vitest_1.expect)(result.credits).toBe(1);
        });
        (0, vitest_1.it)('skips already-confirmed payment (idempotent)', async () => {
            mockPayment.findFirst.mockResolvedValue({
                id: 'pay-1',
                status: 'success',
            });
            const result = await (0, paymentProviderService_1.confirmPayment)('mpesa-ref-123');
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('returns null for unknown provider ref', async () => {
            mockPayment.findFirst.mockResolvedValue(null);
            const result = await (0, paymentProviderService_1.confirmPayment)('unknown-ref');
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)('failPayment', () => {
        (0, vitest_1.it)('marks pending payment as failed', async () => {
            mockPayment.findFirst.mockResolvedValue({
                id: 'pay-1',
                status: 'pending',
            });
            mockPayment.update.mockResolvedValue({});
            await (0, paymentProviderService_1.failPayment)('mpesa-ref-123', 'User cancelled');
            (0, vitest_1.expect)(mockPayment.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                where: { id: 'pay-1' },
                data: vitest_1.expect.objectContaining({ status: 'failed' }),
            }));
        });
        (0, vitest_1.it)('skips non-pending payment', async () => {
            mockPayment.findFirst.mockResolvedValue({
                id: 'pay-1',
                status: 'success',
            });
            await (0, paymentProviderService_1.failPayment)('mpesa-ref-123');
            (0, vitest_1.expect)(mockPayment.update).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('getPaymentById', () => {
        (0, vitest_1.it)('returns payment details', async () => {
            mockPayment.findUnique.mockResolvedValue({
                id: 'pay-1',
                provider: 'mpesa',
                amount: 15000,
                currency: 'KES',
                credits: 1,
                status: 'success',
                providerRef: 'mpesa-ref-123',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const result = await (0, paymentProviderService_1.getPaymentById)('pay-1');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.id).toBe('pay-1');
        });
        (0, vitest_1.it)('returns null for non-existent payment', async () => {
            mockPayment.findUnique.mockResolvedValue(null);
            const result = await (0, paymentProviderService_1.getPaymentById)('nonexistent');
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
});
