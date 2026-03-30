// ============================================================
// CuliCars — Thread 6: Payment Provider Service Tests (FIXED)
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted mocks — self-contained factories
vi.mock('../lib/prisma', () => ({
  default: {
    paymentProvider: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    creditLedger: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    wallet: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(async (fn: any) => {
      const { default: p } = await import('../lib/prisma');
      return fn(p);
    }),
  },
}));

// Mock credit service to avoid nested transaction issues in tests
vi.mock('../services/creditService', () => ({
  grantCredits: vi.fn().mockResolvedValue(10),
}));

import prisma from '../lib/prisma';
import {
  registerProvider,
  getEnabledProviders,
  isProviderEnabled,
  initiatePayment,
  confirmPayment,
  failPayment,
  getPaymentById,
} from '../services/paymentProviderService';
import type { PaymentProviderAdapter } from '../types/payment.types';

const mockProviders = vi.mocked(prisma.paymentProvider);
const mockPayment = vi.mocked(prisma.payment);

// Create a mock provider adapter
const mockAdapter: PaymentProviderAdapter = {
  slug: 'mpesa',
  initiate: vi.fn().mockResolvedValue({
    provider_ref: 'mpesa-ref-123',
    providerData: { checkoutRequestId: 'mpesa-ref-123' },
  }),
  verify: vi.fn().mockResolvedValue({ status: 'success' }),
};

describe('paymentProviderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-register after clearing
    registerProvider(mockAdapter);
  });

  describe('getEnabledProviders', () => {
    it('returns only enabled providers with registered adapters', async () => {
      mockProviders.findMany.mockResolvedValue([
        { id: '1', name: 'M-Pesa', slug: 'mpesa', is_enabled: true },
        { id: '2', name: 'PayPal', slug: 'paypal', is_enabled: true },
      ] as any);

      const providers = await getEnabledProviders();
      // Only mpesa has a registered adapter in this test
      expect(providers).toHaveLength(1);
      expect(providers[0].slug).toBe('mpesa');
    });

    it('returns empty array when no providers enabled', async () => {
      mockProviders.findMany.mockResolvedValue([]);
      const providers = await getEnabledProviders();
      expect(providers).toHaveLength(0);
    });
  });

  describe('isProviderEnabled', () => {
    it('returns true for enabled provider with adapter', async () => {
      mockProviders.findUnique.mockResolvedValue({ is_enabled: true } as any);
      const result = await isProviderEnabled('mpesa');
      expect(result).toBe(true);
    });

    it('returns false for disabled provider', async () => {
      mockProviders.findUnique.mockResolvedValue({ is_enabled: false } as any);
      const result = await isProviderEnabled('mpesa');
      expect(result).toBe(false);
    });

    it('returns false for non-existent provider', async () => {
      mockProviders.findUnique.mockResolvedValue(null);
      const result = await isProviderEnabled('mpesa');
      expect(result).toBe(false);
    });
  });

  describe('initiatePayment', () => {
    it('creates pending payment and calls provider', async () => {
      mockProviders.findUnique.mockResolvedValue({ is_enabled: true } as any);
      mockPayment.create.mockResolvedValue({
        id: 'pay-1',
        user_id: 'user-1',
        provider: 'mpesa',
        amount: 15000,
        currency: 'KES',
        credits: 1,
        status: 'pending',
      } as any);
      mockPayment.update.mockResolvedValue({} as any);

      const result = await initiatePayment({
        user_id: 'user-1',
        packId: 'culicars_credits_1',
        provider: 'mpesa',
        phone: '0712345678',
      });

      expect(result.paymentId).toBe('pay-1');
      expect(result.provider).toBe('mpesa');
      expect(result.status).toBe('pending');
      expect(result.provider_ref).toBe('mpesa-ref-123');

      expect(mockPayment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: 'user-1',
            provider: 'mpesa',
            currency: 'KES',
            credits: 1,
            status: 'pending',
          }),
        })
      );
    });

    it('throws on invalid pack ID', async () => {
      await expect(
        initiatePayment({
          user_id: 'user-1',
          packId: 'nonexistent_pack',
          provider: 'mpesa',
        })
      ).rejects.toThrow('Invalid pack');
    });

    it('throws on disabled provider', async () => {
      mockProviders.findUnique.mockResolvedValue({ is_enabled: false } as any);

      await expect(
        initiatePayment({
          user_id: 'user-1',
          packId: 'culicars_credits_1',
          provider: 'mpesa',
        })
      ).rejects.toThrow('not available');
    });

    it('marks payment as failed if provider initiation fails', async () => {
      mockProviders.findUnique.mockResolvedValue({ is_enabled: true } as any);
      mockPayment.create.mockResolvedValue({
        id: 'pay-fail',
        status: 'pending',
      } as any);
      (mockAdapter.initiate as any).mockRejectedValueOnce(new Error('Provider down'));
      mockPayment.update.mockResolvedValue({} as any);

      await expect(
        initiatePayment({
          user_id: 'user-1',
          packId: 'culicars_credits_1',
          provider: 'mpesa',
          phone: '0712345678',
        })
      ).rejects.toThrow('Provider down');

      expect(mockPayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-fail' },
          data: expect.objectContaining({ status: 'failed' }),
        })
      );
    });
  });

  describe('confirmPayment', () => {
    it('confirms pending payment and grants credits', async () => {
      mockPayment.findFirst.mockResolvedValue({
        id: 'pay-1',
        user_id: 'user-1',
        provider: 'mpesa',
        amount: 15000,
        currency: 'KES',
        credits: 1,
        status: 'pending',
        provider_ref: 'mpesa-ref-123',
      } as any);
      mockPayment.update.mockResolvedValue({} as any);

      const result = await confirmPayment('mpesa-ref-123', { receipt: 'ABC' });

      expect(result).not.toBeNull();
      expect(result!.paymentId).toBe('pay-1');
      expect(result!.credits).toBe(1);
    });

    it('skips already-confirmed payment (idempotent)', async () => {
      mockPayment.findFirst.mockResolvedValue({
        id: 'pay-1',
        status: 'success',
      } as any);

      const result = await confirmPayment('mpesa-ref-123');
      expect(result).toBeNull();
    });

    it('returns null for unknown provider ref', async () => {
      mockPayment.findFirst.mockResolvedValue(null);
      const result = await confirmPayment('unknown-ref');
      expect(result).toBeNull();
    });
  });

  describe('failPayment', () => {
    it('marks pending payment as failed', async () => {
      mockPayment.findFirst.mockResolvedValue({
        id: 'pay-1',
        status: 'pending',
      } as any);
      mockPayment.update.mockResolvedValue({} as any);

      await failPayment('mpesa-ref-123', 'User cancelled');

      expect(mockPayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-1' },
          data: expect.objectContaining({ status: 'failed' }),
        })
      );
    });

    it('skips non-pending payment', async () => {
      mockPayment.findFirst.mockResolvedValue({
        id: 'pay-1',
        status: 'success',
      } as any);

      await failPayment('mpesa-ref-123');
      expect(mockPayment.update).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentById', () => {
    it('returns payment details', async () => {
      mockPayment.findUnique.mockResolvedValue({
        id: 'pay-1',
        provider: 'mpesa',
        amount: 15000,
        currency: 'KES',
        credits: 1,
        status: 'success',
        provider_ref: 'mpesa-ref-123',
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      const result = await getPaymentById('pay-1');
      expect(result).toBeDefined();
      expect(result!.id).toBe('pay-1');
    });

    it('returns null for non-existent payment', async () => {
      mockPayment.findUnique.mockResolvedValue(null);
      const result = await getPaymentById('nonexistent');
      expect(result).toBeNull();
    });
  });
});