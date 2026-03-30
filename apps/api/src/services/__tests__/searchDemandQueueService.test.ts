// apps/api/src/services/__tests__/searchDemandQueueService.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@culicars/database', () => ({
  prisma: {
    $executeRaw: vi.fn().mockResolvedValue(1),
    $queryRawUnsafe: vi.fn(),
  },
}));

import { prisma } from '@culicars/database';
import { enqueue, markEnriched, listQueue } from '../searchDemandQueueService';

describe('searchDemandQueueService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('enqueue', () => {
    it('calls $executeRaw for a vin-keyed entry', async () => {
      await enqueue({ vin: 'TESTVIN123', plate: null, resultState: 'pending_enrichment' });
      expect(vi.mocked(prisma.$executeRaw)).toHaveBeenCalledTimes(1);
    });

    it('calls $executeRaw for a plate-keyed entry when no vin', async () => {
      await enqueue({ plate: 'KCA 123A', vin: null, resultState: 'low_confidence' });
      expect(vi.mocked(prisma.$executeRaw)).toHaveBeenCalledTimes(1);
    });

    it('does not call DB when neither plate nor vin provided', async () => {
      await enqueue({ resultState: 'pending_enrichment' });
      expect(vi.mocked(prisma.$executeRaw)).not.toHaveBeenCalled();
    });

    it('does not throw when DB call fails', async () => {
      vi.mocked(prisma.$executeRaw).mockRejectedValueOnce(new Error('DB down'));
      await expect(enqueue({ vin: 'ABC', resultState: 'pending_enrichment' })).resolves.toBeUndefined();
    });
  });

  describe('markEnriched', () => {
    it('calls $executeRaw with vin', async () => {
      await markEnriched({ vin: 'TESTVIN123' });
      expect(vi.mocked(prisma.$executeRaw)).toHaveBeenCalledTimes(1);
    });

    it('does not throw on DB failure', async () => {
      vi.mocked(prisma.$executeRaw).mockRejectedValueOnce(new Error('DB error'));
      await expect(markEnriched({ vin: 'ABC' })).resolves.toBeUndefined();
    });
  });

  describe('listQueue', () => {
    it('returns entries, total, page, and pageSize from DB', async () => {
      const mockEntries = [{
        id: '1', plate: 'KCA 123A', vin: null,
        resultState: 'pending_enrichment', timesRequested: 3,
        lastRequestedAt: new Date(), enrichedAt: null, created_at: new Date(),
      }];
      vi.mocked(prisma.$queryRawUnsafe)
        .mockResolvedValueOnce(mockEntries)
        .mockResolvedValueOnce([{ count: BigInt(1) }]);

      const result = await listQueue({ page: 1, pageSize: 25 });

      expect(result.entries).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
      expect(result.entries[0].plate).toBe('KCA 123A');
    });

    it('applies default pagination when no params given', async () => {
      vi.mocked(prisma.$queryRawUnsafe)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: BigInt(0) }]);

      const result = await listQueue({});

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(25);
      expect(result.total).toBe(0);
    });
  });
});
