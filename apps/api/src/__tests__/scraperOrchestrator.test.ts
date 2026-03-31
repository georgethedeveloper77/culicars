// apps/api/src/__tests__/scraperOrchestrator.test.ts
import { vi, describe, it, expect, beforeEach, type Mocked, type MockInstance } from 'vitest';
import { runScraper, registerScraper, getRegisteredSources } from '../services/scraperOrchestrator';
import { BaseScraper, RawScrapedItem } from '../services/scrapers/baseScraper';

vi.mock('../services/scraperJobService', () => ({
  createJob: vi.fn(),
  updateJob: vi.fn(),
  completeJob: vi.fn(),
  failJob: vi.fn(),
}));

vi.mock('../processors/rawDataProcessor', () => ({
  processJobRawData: vi.fn(),
}));

import * as jobService from '../services/scraperJobService';
import * as rawDataProcessor from '../processors/rawDataProcessor';

const mockCreateJob = jobService.createJob as vi.Mock;
const mockUpdateJob = jobService.updateJob as vi.Mock;
const mockCompleteJob = jobService.completeJob as vi.Mock;
const mockFailJob = jobService.failJob as vi.Mock;
const mockProcessJobRawData = rawDataProcessor.processJobRawData as vi.Mock;

class MockScraper extends BaseScraper {
  public items: RawScrapedItem[];
  public shouldThrow: boolean;

  constructor(items: RawScrapedItem[] = [], shouldThrow = false) {
    super('TEST', { delayMs: 0 });
    this.items = items;
    this.shouldThrow = shouldThrow;
  }

  async scrape(): Promise<RawScrapedItem[]> {
    if (this.shouldThrow) throw new Error('Scraper network error');
    return this.items;
  }

  async saveRaw(_items: RawScrapedItem[], _jobId: string): Promise<number> {
    return this.items.length;
  }
}

describe('scraperOrchestrator', () => {
  const mockJob = { id: 'job-uuid-1', source: 'JIJI', status: 'queued' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateJob.mockResolvedValue(mockJob);
    mockUpdateJob.mockResolvedValue({});
    mockCompleteJob.mockResolvedValue({});
    mockFailJob.mockResolvedValue({});
    mockProcessJobRawData.mockResolvedValue({ inserted: 5, skipped: 1, processed: 6, errors: 0 });
  });

  describe('runScraper', () => {
    it('creates a job before running', async () => {
      registerScraper('JIJI', () => new MockScraper([], false));
      await runScraper('JIJI', 'manual');
      expect(mockCreateJob).toHaveBeenCalledWith('JIJI', 'manual');
    });

    it('marks job as running with started_at', async () => {
      registerScraper('JIJI', () => new MockScraper());
      await runScraper('JIJI', 'manual');
      expect(mockUpdateJob).toHaveBeenCalledWith(
        'job-uuid-1',
        expect.objectContaining({ status: 'running', started_at: expect.any(Date) })
      );
    });

    it('calls rawDataProcessor after scraping', async () => {
      registerScraper('JIJI', () => new MockScraper([{ source: 'JIJI', vin: null, plate: null, raw_data: {} }]));
      await runScraper('JIJI', 'scheduled');
      expect(mockProcessJobRawData).toHaveBeenCalledWith('job-uuid-1');
    });

    it('completes job with correct counts', async () => {
      const items = [
        { source: 'JIJI', vin: null, plate: null, raw_data: {} },
        { source: 'JIJI', vin: null, plate: null, raw_data: {} },
      ];
      registerScraper('JIJI', () => new MockScraper(items));
      await runScraper('JIJI');
      expect(mockCompleteJob).toHaveBeenCalledWith(
        'job-uuid-1',
        expect.objectContaining({ itemsFound: 2, itemsStored: 2, itemsSkipped: 0 })
      );
    });

    it('returns result with processor counts', async () => {
      registerScraper('JIJI', () => new MockScraper([]));
      const result = await runScraper('JIJI');
      expect(result.processor_inserted).toBe(5);
      expect(result.processor_skipped).toBe(1);
    });

    it('fails job and returns error when scraper throws', async () => {
      registerScraper('JIJI', () => new MockScraper([], true));
      const result = await runScraper('JIJI');
      expect(mockFailJob).toHaveBeenCalledWith('job-uuid-1', 'Scraper network error');
      expect(result.error).toBe('Scraper network error');
      expect(result.items_found).toBe(0);
    });

    it('throws when source is not registered', async () => {
      await expect(runScraper('STC_JAPAN' as never)).rejects.toThrow(
        'No scraper registered for source: STC_JAPAN'
      );
    });
  });

  describe('registerScraper', () => {
    it('adds new scraper to registry', () => {
      const before = getRegisteredSources().length;
      // Re-register existing doesn't add duplicate
      registerScraper('JIJI', () => new MockScraper());
      expect(getRegisteredSources().length).toBe(before);
    });
  });
});
