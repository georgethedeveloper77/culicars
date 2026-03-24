"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseScraper = void 0;
// apps/api/src/services/scrapers/baseScraper.ts
const prisma_1 = __importDefault(require("../../lib/prisma"));
const USER_AGENTS = [
    'CuliCarsBot/1.0 (+https://culicars.com/bot)',
    'Mozilla/5.0 (compatible; CuliCarsBot/1.0; +https://culicars.com/bot)',
    'CuliCarsBot/1.0 (Kenya Vehicle Data Aggregator)',
];
class BaseScraper {
    constructor(source, options = {}) {
        this.lastRequestTime = 0;
        this.source = source;
        this.maxRetries = options.maxRetries ?? 3;
        this.delayMs = options.delayMs ?? parseInt(process.env.SCRAPER_DELAY_MS ?? '1500', 10);
    }
    getUA() {
        return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    }
    async rateLimit() {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < this.delayMs) {
            await this.sleep(this.delayMs - elapsed);
        }
        this.lastRequestTime = Date.now();
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async withRetry(fn, attempt = 1) {
        try {
            await this.rateLimit();
            return await fn();
        }
        catch (err) {
            if (attempt >= this.maxRetries) {
                throw err;
            }
            const backoff = Math.min(1000 * 2 ** (attempt - 1), 30000);
            await this.sleep(backoff);
            return this.withRetry(fn, attempt + 1);
        }
    }
    async saveRaw(items, jobId) {
        if (items.length === 0)
            return 0;
        const data = items.map((item) => ({
            jobId: jobId,
            source: item.source,
            rawData: item.rawData,
            vin: item.vin ?? null,
            plate: item.plate ?? null,
            processed: false,
        }));
        const result = await prisma_1.default.scraperDataRaw.createMany({ data: data });
        return result.count;
    }
}
exports.BaseScraper = BaseScraper;
