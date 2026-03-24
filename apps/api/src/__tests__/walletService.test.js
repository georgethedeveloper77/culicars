"use strict";
// ============================================================
// CuliCars — Thread 6: Wallet Service Tests (FIXED)
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// vi.mock is HOISTED — factory cannot reference variables declared
// in the same scope. Return the mock object inline.
vitest_1.vi.mock('../lib/prisma', () => ({
    default: {
        wallet: {
            upsert: vitest_1.vi.fn(),
            findUnique: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
        },
    },
}));
// Now import after mock is set up
const prisma_1 = __importDefault(require("../lib/prisma"));
const walletService_1 = require("../services/walletService");
// Cast for easy access in tests
const mockWallet = vitest_1.vi.mocked(prisma_1.default.wallet);
(0, vitest_1.describe)('walletService', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.describe)('getOrCreateWallet', () => {
        (0, vitest_1.it)('returns existing wallet', async () => {
            mockWallet.upsert.mockResolvedValue({
                userId: 'user-1',
                balance: 5,
                updatedAt: new Date('2025-01-01'),
            });
            const result = await (0, walletService_1.getOrCreateWallet)('user-1');
            (0, vitest_1.expect)(result.balance).toBe(5);
            (0, vitest_1.expect)(result.userId).toBe('user-1');
        });
        (0, vitest_1.it)('creates wallet with 0 balance if none exists', async () => {
            mockWallet.upsert.mockResolvedValue({
                userId: 'user-new',
                balance: 0,
                updatedAt: null,
            });
            const result = await (0, walletService_1.getOrCreateWallet)('user-new');
            (0, vitest_1.expect)(result.balance).toBe(0);
        });
    });
    (0, vitest_1.describe)('getBalance', () => {
        (0, vitest_1.it)('returns balance for existing wallet', async () => {
            mockWallet.findUnique.mockResolvedValue({ balance: 10 });
            const balance = await (0, walletService_1.getBalance)('user-1');
            (0, vitest_1.expect)(balance).toBe(10);
        });
        (0, vitest_1.it)('returns 0 for non-existent wallet', async () => {
            mockWallet.findUnique.mockResolvedValue(null);
            const balance = await (0, walletService_1.getBalance)('user-none');
            (0, vitest_1.expect)(balance).toBe(0);
        });
    });
    (0, vitest_1.describe)('creditWallet', () => {
        (0, vitest_1.it)('adds credits to wallet', async () => {
            const mockTx = {
                wallet: {
                    upsert: vitest_1.vi.fn().mockResolvedValue({ balance: 15 }),
                },
            };
            const newBalance = await (0, walletService_1.creditWallet)(mockTx, 'user-1', 5);
            (0, vitest_1.expect)(newBalance).toBe(15);
            (0, vitest_1.expect)(mockTx.wallet.upsert).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                where: { userId: 'user-1' },
                update: vitest_1.expect.objectContaining({
                    balance: { increment: 5 },
                }),
                create: vitest_1.expect.objectContaining({
                    userId: 'user-1',
                    balance: 5,
                }),
            }));
        });
        (0, vitest_1.it)('throws on zero amount', async () => {
            const mockTx = {};
            await (0, vitest_1.expect)((0, walletService_1.creditWallet)(mockTx, 'user-1', 0)).rejects.toThrow('Credit amount must be positive');
        });
        (0, vitest_1.it)('throws on negative amount', async () => {
            const mockTx = {};
            await (0, vitest_1.expect)((0, walletService_1.creditWallet)(mockTx, 'user-1', -5)).rejects.toThrow('Credit amount must be positive');
        });
    });
    (0, vitest_1.describe)('debitWallet', () => {
        (0, vitest_1.it)('subtracts credits from wallet', async () => {
            const mockTx = {
                wallet: {
                    update: vitest_1.vi.fn().mockResolvedValue({ balance: 3 }),
                },
            };
            const newBalance = await (0, walletService_1.debitWallet)(mockTx, 'user-1', 2);
            (0, vitest_1.expect)(newBalance).toBe(3);
            (0, vitest_1.expect)(mockTx.wallet.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                where: { userId: 'user-1' },
                data: vitest_1.expect.objectContaining({
                    balance: { decrement: 2 },
                }),
            }));
        });
        (0, vitest_1.it)('throws on zero amount', async () => {
            const mockTx = {};
            await (0, vitest_1.expect)((0, walletService_1.debitWallet)(mockTx, 'user-1', 0)).rejects.toThrow('Debit amount must be positive');
        });
    });
});
