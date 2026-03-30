// apps/api/src/services/__tests__/creditService.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock PrismaClient before importing creditService
vi.mock('@prisma/client', () => {
  const mockTx = {
    aggregate: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  };
  return {
    PrismaClient: vi.fn(() => ({
      credit_transactions: mockTx,
      report_unlock: mockTx,
    })),
  };
});

import { getBalance, deductForUnlock, confirmPayment } from '../creditService';
import { PrismaClient } from '@prisma/client';

const prismaInstance = new (PrismaClient as any)();
const mockTx = prismaInstance.credit_transactions;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getBalance', () => {
  it('returns sum of confirmed transactions', async () => {
    mockTx.aggregate.mockResolvedValue({ _sum: { amount: 12 } });
    const bal = await getBalance('user-1');
    expect(bal).toBe(12);
    expect(mockTx.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { user_id: 'user-1', status: 'confirmed' } })
    );
  });

  it('returns 0 when no transactions exist', async () => {
    mockTx.aggregate.mockResolvedValue({ _sum: { amount: null } });
    const bal = await getBalance('user-2');
    expect(bal).toBe(0);
  });
});

describe('deductForUnlock', () => {
  it('returns success: false when balance is insufficient', async () => {
    mockTx.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
    const result = await deductForUnlock('user-1', 'report-1', 1);
    expect(result.success).toBe(false);
    expect(mockTx.create).not.toHaveBeenCalled();
  });

  it('creates a debit transaction when balance is sufficient', async () => {
    // First call: getBalance in deductForUnlock → 5 credits
    // Second call: getBalance after append → 4 credits
    mockTx.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 5 } })
      .mockResolvedValueOnce({ _sum: { amount: 4 } });
    mockTx.create.mockResolvedValue({ id: 'tx-1' });

    const result = await deductForUnlock('user-1', 'report-1', 1);
    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(4);
    expect(mockTx.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: -1, type: 'unlock', status: 'confirmed' }),
      })
    );
  });
});

describe('confirmPayment', () => {
  it('returns null when no transaction found for providerRef', async () => {
    mockTx.findUnique.mockResolvedValue(null);
    const result = await confirmPayment('ref-not-found');
    expect(result).toBeNull();
  });

  it('returns existing data without update when already confirmed (idempotent)', async () => {
    mockTx.findUnique.mockResolvedValue({
      status: 'confirmed',
      user_id: 'user-1',
      amount: 15,
    });
    const result = await confirmPayment('ref-already-confirmed');
    expect(result).toEqual({ user_id: 'user-1', credits: 15 });
    expect(mockTx.update).not.toHaveBeenCalled();
  });

  it('confirms a pending transaction', async () => {
    mockTx.findUnique.mockResolvedValue({
      status: 'pending',
      user_id: 'user-2',
      amount: 5,
    });
    mockTx.update.mockResolvedValue({});
    const result = await confirmPayment('ref-pending');
    expect(result).toEqual({ user_id: 'user-2', credits: 5 });
    expect(mockTx.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { provider_ref: 'ref-pending' },
        data: { status: 'confirmed' },
      })
    );
  });
});
