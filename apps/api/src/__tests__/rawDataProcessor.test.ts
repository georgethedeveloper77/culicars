// apps/api/src/__tests__/rawDataProcessor.test.ts
import { vi, describe, it, expect, beforeEach, type Mocked, type MockInstance } from 'vitest';
import { processJobRawData } from '../processors/rawDataProcessor';

vi.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    scraperDataRaw: {
      findMany: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

vi.mock('../processors/serviceRecordProcessor', () => ({
  processServiceRecord: vi.fn().mockResolvedValue(true),
}));

vi.mock('../processors/listingProcessor', () => ({
  processListing: vi.fn().mockResolvedValue(true),
}));

vi.mock('../processors/auctionProcessor', () => ({
  processAuction: vi.fn().mockResolvedValue(true),
}));

vi.mock('../processors/vinNormalizer', () => ({
  normalizeVin: vi.fn((v: string | null) => v),
}));

import prisma from '../lib/prisma';
import { processListing } from '../processors/listingProcessor';
import { processAuction } from '../processors/auctionProcessor';
import { processServiceRecord } from '../processors/serviceRecordProcessor';

const mockPrisma = prisma as Mocked<typeof prisma>;

const makeRow = (id: string, source: string, extra = {}) => ({
  id,
  job_id: 'job-abc',
  source,
  vin: null,
  plate: null,
  processed: false,
  created_at: new Date(),
  raw_data: { title: 'Test Vehicle', confidence: 0.5, event_type: 'LISTED_FOR_SALE', ...extra },
});

describe('rawDataProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('routes JIJI rows to listingProcessor', async () => {
    (mockPrisma.scraperDataRaw.findMany as MockInstance).mockResolvedValue([
      makeRow('row-1', 'JIJI'),
    ]);
    (mockPrisma.scraperDataRaw.update as MockInstance).mockResolvedValue({});

    await processJobRawData('job-abc');

    expect(processListing).toHaveBeenCalledTimes(1);
    expect(processAuction).not.toHaveBeenCalled();
    expect(processServiceRecord).not.toHaveBeenCalled();
  });

  it('routes AUTO_EXPRESS rows to serviceRecordProcessor', async () => {
    (mockPrisma.scraperDataRaw.findMany as MockInstance).mockResolvedValue([
      makeRow('row-1', 'AUTO_EXPRESS'),
    ]);
    (mockPrisma.scraperDataRaw.update as MockInstance).mockResolvedValue({});

    await processJobRawData('job-abc');

    expect(processServiceRecord).toHaveBeenCalledTimes(1);
  });

  it('routes BEFORWARD rows to auctionProcessor', async () => {
    (mockPrisma.scraperDataRaw.findMany as MockInstance).mockResolvedValue([
      makeRow('row-1', 'BEFORWARD'),
    ]);
    (mockPrisma.scraperDataRaw.update as MockInstance).mockResolvedValue({});

    await processJobRawData('job-abc');

    expect(processAuction).toHaveBeenCalledTimes(1);
  });

  it('marks each row as processed=true after handling', async () => {
    (mockPrisma.scraperDataRaw.findMany as MockInstance).mockResolvedValue([
      makeRow('row-1', 'JIJI'),
      makeRow('row-2', 'KRA_IBID'),
    ]);
    (mockPrisma.scraperDataRaw.update as MockInstance).mockResolvedValue({});

    await processJobRawData('job-abc');

    expect(mockPrisma.scraperDataRaw.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.scraperDataRaw.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'row-1' },
        data: expect.objectContaining({ processed: true, processed_at: expect.any(Date) }),
      })
    );
    expect(mockPrisma.scraperDataRaw.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'row-2' },
        data: expect.objectContaining({ processed: true }),
      })
    );
  });

  it('marks row as processed even when sub-processor throws', async () => {
    (mockPrisma.scraperDataRaw.findMany as MockInstance).mockResolvedValue([
      makeRow('row-err', 'JIJI'),
    ]);
    (mockPrisma.scraperDataRaw.update as MockInstance).mockResolvedValue({});
    (processListing as MockInstance).mockRejectedValueOnce(new Error('DB error'));

    const result = await processJobRawData('job-abc');

    expect(result.errors).toBe(1);
    expect(mockPrisma.scraperDataRaw.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'row-err' } })
    );
  });

  it('returns correct counts', async () => {
    (mockPrisma.scraperDataRaw.findMany as MockInstance).mockResolvedValue([
      makeRow('row-1', 'JIJI'),
      makeRow('row-2', 'PIGIAME'),
      makeRow('row-3', 'BEFORWARD'),
    ]);
    (mockPrisma.scraperDataRaw.update as MockInstance).mockResolvedValue({});
    (processListing as MockInstance).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    (processAuction as MockInstance).mockResolvedValueOnce(true);

    const result = await processJobRawData('job-abc');

    expect(result.processed).toBe(3);
    expect(result.inserted).toBe(2); // row-1 and row-3
    expect(result.skipped).toBe(1);  // row-2 (dupe)
    expect(result.errors).toBe(0);
  });
});
