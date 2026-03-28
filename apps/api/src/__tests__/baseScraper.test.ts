// apps/api/src/__tests__/baseScraper.test.ts
import { vi, describe, it, expect, beforeEach, type Mocked, type MockInstance } from 'vitest';
import { BaseScraper, RawScrapedItem } from '../services/scrapers/baseScraper';

vi.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    scraperDataRaw: {
      createMany: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
const mockPrisma = prisma as Mocked<typeof prisma>;

// Concrete subclass for testing
class TestScraper extends BaseScraper {
  public scrapeCallCount = 0;
  public shouldFail = false;
  public failUntilAttempt = 0;
  private attempt = 0;

  constructor(options = {}) {
    super('TEST', { delayMs: 0, maxRetries: 3, ...options });
  }

  async scrape(): Promise<RawScrapedItem[]> {
    this.scrapeCallCount++;
    return [
      { source: 'TEST', vin: 'JTDBR32E540012345', plate: 'KCA123A', raw_data: { title: 'Test Car' } },
    ];
  }

  // Expose protected methods for testing
  async testWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    return this.withRetry(fn);
  }

  async testRateLimit(): Promise<void> {
    return this.rateLimit();
  }
}

describe('BaseScraper', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('saveRaw', () => {
    it('saves items to scraper_data_raw', async () => {
      (mockPrisma.scraperDataRaw.createMany as MockInstance).mockResolvedValue({ count: 2 });

      const scraper = new TestScraper();
      const items: RawScrapedItem[] = [
        { source: 'TEST', vin: 'VIN1111111111111111', plate: null, raw_data: { a: 1 } },
        { source: 'TEST', vin: null, plate: 'KCA999Z', raw_data: { b: 2 } },
      ];

      const count = await scraper.saveRaw(items, 'job-123');

      expect(count).toBe(2);
      expect(mockPrisma.scraperDataRaw.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ jobId: 'job-123', source: 'TEST', vin: 'VIN1111111111111111', plate: null, processed: false }),
          expect.objectContaining({ jobId: 'job-123', source: 'TEST', vin: null, plate: 'KCA999Z', processed: false }),
        ],
      });
    });

    it('returns 0 and skips DB call for empty array', async () => {
      const scraper = new TestScraper();
      const count = await scraper.saveRaw([], 'job-123');
      expect(count).toBe(0);
      expect(mockPrisma.scraperDataRaw.createMany).not.toHaveBeenCalled();
    });
  });

  describe('withRetry', () => {
    it('succeeds on first attempt', async () => {
      const scraper = new TestScraper();
      const fn = vi.fn().mockResolvedValue('success');
      const result = await scraper.testWithRetry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and succeeds on second attempt', async () => {
      const scraper = new TestScraper({ delayMs: 0, maxRetries: 3 });
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');

      const result = await scraper.testWithRetry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws after maxRetries exceeded', async () => {
      const scraper = new TestScraper({ delayMs: 0, maxRetries: 3 });
      const fn = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(scraper.testWithRetry(fn)).rejects.toThrow('Persistent failure');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('getUA', () => {
    it('returns a non-empty user agent string', () => {
      const scraper = new TestScraper();
      const ua = (scraper as unknown as { getUA(): string }).getUA();
      expect(typeof ua).toBe('string');
      expect(ua.length).toBeGreaterThan(0);
      expect(ua).toContain('CuliCarsBot');
    });
  });
});
