// ============================================================
// CuliCars — Thread 6: Wallet Service Tests (FIXED)
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is HOISTED — factory cannot reference variables declared
// in the same scope. Return the mock object inline.
vi.mock('../lib/prisma', () => ({
  default: {
    wallet: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Now import after mock is set up
import prisma from '../lib/prisma';
import {
  getOrCreateWallet,
  getBalance,
  creditWallet,
  debitWallet,
} from '../services/walletService';

// Cast for easy access in tests
const mockWallet = vi.mocked(prisma.wallet);

describe('walletService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrCreateWallet', () => {
    it('returns existing wallet', async () => {
      mockWallet.upsert.mockResolvedValue({
        userId: 'user-1',
        balance: 5,
        updatedAt: new Date('2025-01-01'),
      } as any);

      const result = await getOrCreateWallet('user-1');
      expect(result.balance).toBe(5);
      expect(result.userId).toBe('user-1');
    });

    it('creates wallet with 0 balance if none exists', async () => {
      mockWallet.upsert.mockResolvedValue({
        userId: 'user-new',
        balance: 0,
        updatedAt: null,
      } as any);

      const result = await getOrCreateWallet('user-new');
      expect(result.balance).toBe(0);
    });
  });

  describe('getBalance', () => {
    it('returns balance for existing wallet', async () => {
      mockWallet.findUnique.mockResolvedValue({ balance: 10 } as any);
      const balance = await getBalance('user-1');
      expect(balance).toBe(10);
    });

    it('returns 0 for non-existent wallet', async () => {
      mockWallet.findUnique.mockResolvedValue(null);
      const balance = await getBalance('user-none');
      expect(balance).toBe(0);
    });
  });

  describe('creditWallet', () => {
    it('adds credits to wallet', async () => {
      const mockTx = {
        wallet: {
          upsert: vi.fn().mockResolvedValue({ balance: 15 }),
        },
      } as any;

      const newBalance = await creditWallet(mockTx, 'user-1', 5);
      expect(newBalance).toBe(15);
      expect(mockTx.wallet.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          update: expect.objectContaining({
            balance: { increment: 5 },
          }),
          create: expect.objectContaining({
            userId: 'user-1',
            balance: 5,
          }),
        })
      );
    });

    it('throws on zero amount', async () => {
      const mockTx = {} as any;
      await expect(creditWallet(mockTx, 'user-1', 0)).rejects.toThrow(
        'Credit amount must be positive'
      );
    });

    it('throws on negative amount', async () => {
      const mockTx = {} as any;
      await expect(creditWallet(mockTx, 'user-1', -5)).rejects.toThrow(
        'Credit amount must be positive'
      );
    });
  });

  describe('debitWallet', () => {
    it('subtracts credits from wallet', async () => {
      const mockTx = {
        wallet: {
          update: vi.fn().mockResolvedValue({ balance: 3 }),
        },
      } as any;

      const newBalance = await debitWallet(mockTx, 'user-1', 2);
      expect(newBalance).toBe(3);
      expect(mockTx.wallet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          data: expect.objectContaining({
            balance: { decrement: 2 },
          }),
        })
      );
    });

    it('throws on zero amount', async () => {
      const mockTx = {} as any;
      await expect(debitWallet(mockTx, 'user-1', 0)).rejects.toThrow(
        'Debit amount must be positive'
      );
    });
  });
});