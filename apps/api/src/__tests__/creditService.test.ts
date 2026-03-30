// ============================================================
// CuliCars — Thread 6: Credit Service Tests (FIXED)
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mocks — factory must be self-contained (no external var refs)
vi.mock('../lib/prisma', () => ({
  default: {
    wallet: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    creditLedger: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(async (fn: any) => {
      // We need to dynamically import the mocked prisma to pass as tx
      const { default: p } = await import('../lib/prisma');
      return fn({
        wallet: p.wallet,
        creditLedger: p.creditLedger,
      });
    }),
  },
}));

import prisma from '../lib/prisma';
import { grantCredits, deductCredits, adminGrantCredits } from '../services/creditService';

const mockWallet = vi.mocked(prisma.wallet);
const mockLedger = vi.mocked(prisma.creditLedger);
const mock$transaction = vi.mocked(prisma.$transaction);

describe('creditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Re-wire $transaction after clearAllMocks wipes it
    mock$transaction.mockImplementation(async (fn: any) => {
      return fn({
        wallet: mockWallet,
        creditLedger: mockLedger,
      });
    });

    // Default: wallet exists with balance 5
    mockWallet.findUnique.mockResolvedValue({ balance: 5 } as any);
    mockWallet.upsert.mockResolvedValue({ balance: 10 } as any);
    mockWallet.update.mockResolvedValue({ balance: 3 } as any);
    mockLedger.create.mockResolvedValue({ id: 'ledger-1' } as any);
    mockLedger.findFirst.mockResolvedValue(null);
  });

  describe('grantCredits', () => {
    it('grants credits and creates ledger entry', async () => {
      const newBalance = await grantCredits({
        user_id: 'user-1',
        credits: 5,
        type: 'purchase',
        source: 'mpesa_purchase',
        tx_ref: 'mpesa-ref-123',
      });

      expect(newBalance).toBe(10);
      expect(mock$transaction).toHaveBeenCalledTimes(1);

      // Ledger entry created with correct delta
      expect(mockLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: 'user-1',
            type: 'purchase',
            credits_delta: 5,
            balanceBefore: 5,
            balanceAfter: 10,
            source: 'mpesa_purchase',
            tx_ref: 'mpesa-ref-123',
          }),
        })
      );
    });

    it('is idempotent — returns current balance if txRef already used', async () => {
      // txRef already exists in ledger
      mockLedger.findFirst.mockResolvedValue({
        id: 'existing-ledger',
        tx_ref: 'already-used',
      } as any);
      mockWallet.findUnique.mockResolvedValue({ balance: 10 } as any);

      const balance = await grantCredits({
        user_id: 'user-1',
        credits: 5,
        type: 'purchase',
        source: 'mpesa_purchase',
        tx_ref: 'already-used',
      });

      // Should NOT call $transaction (skipped due to idempotency)
      expect(mock$transaction).not.toHaveBeenCalled();
      expect(balance).toBe(10);
    });

    it('throws on zero credits', async () => {
      await expect(
        grantCredits({
          user_id: 'user-1',
          credits: 0,
          type: 'purchase',
          source: 'test',
        })
      ).rejects.toThrow('Credits must be positive');
    });

    it('throws on negative credits', async () => {
      await expect(
        grantCredits({
          user_id: 'user-1',
          credits: -3,
          type: 'purchase',
          source: 'test',
        })
      ).rejects.toThrow('Credits must be positive');
    });
  });

  describe('deductCredits', () => {
    it('deducts credits and creates negative ledger entry', async () => {
      const newBalance = await deductCredits({
        user_id: 'user-1',
        credits: 2,
        type: 'spend',
        source: 'report_unlock',
        report_id: 'report-1',
      });

      expect(newBalance).toBe(3);
      expect(mockLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            credits_delta: -2,
            balanceBefore: 5,
            balanceAfter: 3,
            source: 'report_unlock',
            report_id: 'report-1',
          }),
        })
      );
    });

    it('throws if insufficient balance', async () => {
      mockWallet.findUnique.mockResolvedValue({ balance: 1 } as any);

      await expect(
        deductCredits({
          user_id: 'user-1',
          credits: 5,
          type: 'spend',
          source: 'report_unlock',
        })
      ).rejects.toThrow('Insufficient credits');
    });
  });

  describe('adminGrantCredits', () => {
    it('grants credits with admin metadata', async () => {
      const newBalance = await adminGrantCredits(
        'admin-1',
        'user-1',
        3,
        'Customer support refund'
      );

      expect(newBalance).toBe(10);
      expect(mockLedger.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'admin_grant',
            source: 'admin_grant',
            metadata: {
              grantedBy: 'admin-1',
              reason: 'Customer support refund',
            },
          }),
        })
      );
    });
  });
});