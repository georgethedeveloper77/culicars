"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/__tests__/baseScraper.test.ts
const vitest_1 = require("vitest");
const baseScraper_1 = require("../services/scrapers/baseScraper");
vitest_1.vi.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        scraper_data_raw: {
            createMany: vitest_1.vi.fn(),
        },
    },
}));
const prisma_1 = __importDefault(require("../lib/prisma"));
const mockPrisma = prisma_1.default;
// Concrete subclass for testing
class TestScraper extends baseScraper_1.BaseScraper {
    constructor(options = {}) {
        super('TEST', { delayMs: 0, maxRetries: 3, ...options });
        this.scrapeCallCount = 0;
        this.shouldFail = false;
        this.failUntilAttempt = 0;
        this.attempt = 0;
    }
    async scrape() {
        this.scrapeCallCount++;
        return [
            { source: 'TEST', vin: 'JTDBR32E540012345', plate: 'KCA123A', raw_data: { title: 'Test Car' } },
        ];
    }
    // Expose protected methods for testing
    async testWithRetry(fn) {
        return this.withRetry(fn);
    }
    async testRateLimit() {
        return this.rateLimit();
    }
}
(0, vitest_1.describe)('BaseScraper', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.describe)('saveRaw', () => {
        (0, vitest_1.it)('saves items to scraper_data_raw', async () => {
            mockPrisma.scraper_data_raw.createMany.mockResolvedValue({ count: 2 });
            const scraper = new TestScraper();
            const items = [
                { source: 'TEST', vin: 'VIN1111111111111111', plate: null, raw_data: { a: 1 } },
                { source: 'TEST', vin: null, plate: 'KCA999Z', raw_data: { b: 2 } },
            ];
            const count = await scraper.saveRaw(items, 'job-123');
            (0, vitest_1.expect)(count).toBe(2);
            (0, vitest_1.expect)(mockPrisma.scraper_data_raw.createMany).toHaveBeenCalledWith({
                data: [
                    vitest_1.expect.objectContaining({ job_id: 'job-123', source: 'TEST', vin: 'VIN1111111111111111', plate: null, processed: false }),
                    vitest_1.expect.objectContaining({ job_id: 'job-123', source: 'TEST', vin: null, plate: 'KCA999Z', processed: false }),
                ],
            });
        });
        (0, vitest_1.it)('returns 0 and skips DB call for empty array', async () => {
            const scraper = new TestScraper();
            const count = await scraper.saveRaw([], 'job-123');
            (0, vitest_1.expect)(count).toBe(0);
            (0, vitest_1.expect)(mockPrisma.scraper_data_raw.createMany).not.toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('withRetry', () => {
        (0, vitest_1.it)('succeeds on first attempt', async () => {
            const scraper = new TestScraper();
            const fn = vitest_1.vi.fn().mockResolvedValue('success');
            const result = await scraper.testWithRetry(fn);
            (0, vitest_1.expect)(result).toBe('success');
            (0, vitest_1.expect)(fn).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('retries on failure and succeeds on second attempt', async () => {
            const scraper = new TestScraper({ delayMs: 0, maxRetries: 3 });
            const fn = vitest_1.vi.fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValue('success');
            const result = await scraper.testWithRetry(fn);
            (0, vitest_1.expect)(result).toBe('success');
            (0, vitest_1.expect)(fn).toHaveBeenCalledTimes(2);
        });
        (0, vitest_1.it)('throws after maxRetries exceeded', async () => {
            const scraper = new TestScraper({ delayMs: 0, maxRetries: 3 });
            const fn = vitest_1.vi.fn().mockRejectedValue(new Error('Persistent failure'));
            await (0, vitest_1.expect)(scraper.testWithRetry(fn)).rejects.toThrow('Persistent failure');
            (0, vitest_1.expect)(fn).toHaveBeenCalledTimes(3);
        });
    });
    (0, vitest_1.describe)('getUA', () => {
        (0, vitest_1.it)('returns a non-empty user agent string', () => {
            const scraper = new TestScraper();
            const ua = scraper.getUA();
            (0, vitest_1.expect)(typeof ua).toBe('string');
            (0, vitest_1.expect)(ua.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(ua).toContain('CuliCarsBot');
        });
    });
});
