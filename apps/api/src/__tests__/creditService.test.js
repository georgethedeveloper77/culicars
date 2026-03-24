"use strict";
// ============================================================
// CuliCars — Thread 6: Credit Service Tests (FIXED)
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
// Hoisted mocks — factory must be self-contained (no external var refs)
vitest_1.vi.mock('../lib/prisma', () => ({
    default: {
        wallet: {
            findUnique: vitest_1.vi.fn(),
            upsert: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
        },
        creditLedger: {
            create: vitest_1.vi.fn(),
            findFirst: vitest_1.vi.fn(),
        },
        $transaction: vitest_1.vi.fn(async (fn) => {
            // We need to dynamically import the mocked prisma to pass as tx
            const { default: p } = await Promise.resolve().then(() => __importStar(require('../lib/prisma')));
            return fn({
                wallet: p.wallet,
                creditLedger: p.creditLedger,
            });
        }),
    },
}));
const prisma_1 = __importDefault(require("../lib/prisma"));
const creditService_1 = require("../services/creditService");
const mockWallet = vitest_1.vi.mocked(prisma_1.default.wallet);
const mockLedger = vitest_1.vi.mocked(prisma_1.default.creditLedger);
const mock$transaction = vitest_1.vi.mocked(prisma_1.default.$transaction);
(0, vitest_1.describe)('creditService', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        // Re-wire $transaction after clearAllMocks wipes it
        mock$transaction.mockImplementation(async (fn) => {
            return fn({
                wallet: mockWallet,
                creditLedger: mockLedger,
            });
        });
        // Default: wallet exists with balance 5
        mockWallet.findUnique.mockResolvedValue({ balance: 5 });
        mockWallet.upsert.mockResolvedValue({ balance: 10 });
        mockWallet.update.mockResolvedValue({ balance: 3 });
        mockLedger.create.mockResolvedValue({ id: 'ledger-1' });
        mockLedger.findFirst.mockResolvedValue(null);
    });
    (0, vitest_1.describe)('grantCredits', () => {
        (0, vitest_1.it)('grants credits and creates ledger entry', async () => {
            const newBalance = await (0, creditService_1.grantCredits)({
                userId: 'user-1',
                credits: 5,
                type: 'purchase',
                source: 'mpesa_purchase',
                txRef: 'mpesa-ref-123',
            });
            (0, vitest_1.expect)(newBalance).toBe(10);
            (0, vitest_1.expect)(mock$transaction).toHaveBeenCalledTimes(1);
            // Ledger entry created with correct delta
            (0, vitest_1.expect)(mockLedger.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                data: vitest_1.expect.objectContaining({
                    userId: 'user-1',
                    type: 'purchase',
                    creditsDelta: 5,
                    balanceBefore: 5,
                    balanceAfter: 10,
                    source: 'mpesa_purchase',
                    txRef: 'mpesa-ref-123',
                }),
            }));
        });
        (0, vitest_1.it)('is idempotent — returns current balance if txRef already used', async () => {
            // txRef already exists in ledger
            mockLedger.findFirst.mockResolvedValue({
                id: 'existing-ledger',
                txRef: 'already-used',
            });
            mockWallet.findUnique.mockResolvedValue({ balance: 10 });
            const balance = await (0, creditService_1.grantCredits)({
                userId: 'user-1',
                credits: 5,
                type: 'purchase',
                source: 'mpesa_purchase',
                txRef: 'already-used',
            });
            // Should NOT call $transaction (skipped due to idempotency)
            (0, vitest_1.expect)(mock$transaction).not.toHaveBeenCalled();
            (0, vitest_1.expect)(balance).toBe(10);
        });
        (0, vitest_1.it)('throws on zero credits', async () => {
            await (0, vitest_1.expect)((0, creditService_1.grantCredits)({
                userId: 'user-1',
                credits: 0,
                type: 'purchase',
                source: 'test',
            })).rejects.toThrow('Credits must be positive');
        });
        (0, vitest_1.it)('throws on negative credits', async () => {
            await (0, vitest_1.expect)((0, creditService_1.grantCredits)({
                userId: 'user-1',
                credits: -3,
                type: 'purchase',
                source: 'test',
            })).rejects.toThrow('Credits must be positive');
        });
    });
    (0, vitest_1.describe)('deductCredits', () => {
        (0, vitest_1.it)('deducts credits and creates negative ledger entry', async () => {
            const newBalance = await (0, creditService_1.deductCredits)({
                userId: 'user-1',
                credits: 2,
                type: 'spend',
                source: 'report_unlock',
                reportId: 'report-1',
            });
            (0, vitest_1.expect)(newBalance).toBe(3);
            (0, vitest_1.expect)(mockLedger.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                data: vitest_1.expect.objectContaining({
                    creditsDelta: -2,
                    balanceBefore: 5,
                    balanceAfter: 3,
                    source: 'report_unlock',
                    reportId: 'report-1',
                }),
            }));
        });
        (0, vitest_1.it)('throws if insufficient balance', async () => {
            mockWallet.findUnique.mockResolvedValue({ balance: 1 });
            await (0, vitest_1.expect)((0, creditService_1.deductCredits)({
                userId: 'user-1',
                credits: 5,
                type: 'spend',
                source: 'report_unlock',
            })).rejects.toThrow('Insufficient credits');
        });
    });
    (0, vitest_1.describe)('adminGrantCredits', () => {
        (0, vitest_1.it)('grants credits with admin metadata', async () => {
            const newBalance = await (0, creditService_1.adminGrantCredits)('admin-1', 'user-1', 3, 'Customer support refund');
            (0, vitest_1.expect)(newBalance).toBe(10);
            (0, vitest_1.expect)(mockLedger.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                data: vitest_1.expect.objectContaining({
                    type: 'admin_grant',
                    source: 'admin_grant',
                    metadata: {
                        grantedBy: 'admin-1',
                        reason: 'Customer support refund',
                    },
                }),
            }));
        });
    });
});
