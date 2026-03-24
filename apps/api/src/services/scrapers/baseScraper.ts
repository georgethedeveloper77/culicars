// apps/api/src/services/scrapers/baseScraper.ts
import prisma from '../../lib/prisma';

export interface RawScrapedItem {
  source: string;
  vin?: string | null;
  plate?: string | null;
  rawData: Record<string, unknown>;
}

export interface ScraperOptions {
  maxRetries?: number;
  delayMs?: number;
  concurrency?: number;
}

const USER_AGENTS = [
  'CuliCarsBot/1.0 (+https://culicars.com/bot)',
  'Mozilla/5.0 (compatible; CuliCarsBot/1.0; +https://culicars.com/bot)',
  'CuliCarsBot/1.0 (Kenya Vehicle Data Aggregator)',
];

export abstract class BaseScraper {
  protected source: string;
  protected maxRetries: number;
  protected delayMs: number;
  private lastRequestTime = 0;

  constructor(source: string, options: ScraperOptions = {}) {
    this.source = source;
    this.maxRetries = options.maxRetries ?? 3;
    this.delayMs = options.delayMs ?? parseInt(process.env.SCRAPER_DELAY_MS ?? '1500', 10);
  }

  abstract scrape(): Promise<RawScrapedItem[]>;

  protected getUA(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  protected async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.delayMs) {
      await this.sleep(this.delayMs - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected async withRetry<T>(
    fn: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      await this.rateLimit();
      return await fn();
    } catch (err) {
      if (attempt >= this.maxRetries) {
        throw err;
      }
      const backoff = Math.min(1000 * 2 ** (attempt - 1), 30_000);
      await this.sleep(backoff);
      return this.withRetry(fn, attempt + 1);
    }
  }

  async saveRaw(items: RawScrapedItem[], jobId: string): Promise<number> {
    if (items.length === 0) return 0;

    const data = items.map((item) => ({
      jobId: jobId,
      source: item.source,
      rawData: item.rawData as any,
      vin: item.vin ?? null,
      plate: item.plate ?? null,
      processed: false,
    }));

    const result = await prisma.scraperDataRaw.createMany({ data: data as any });
    return result.count;
  }
}
