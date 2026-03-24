"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/__tests__/scraperOrchestrator.test.ts
const vitest_1 = require("vitest");
const scraperOrchestrator_1 = require("../services/scraperOrchestrator");
const baseScraper_1 = require("../services/scrapers/baseScraper");
vitest_1.vi.mock('../services/scraperJobService', () => ({
    createJob: vitest_1.vi.fn(),
    updateJob: vitest_1.vi.fn(),
    completeJob: vitest_1.vi.fn(),
    failJob: vitest_1.vi.fn(),
}));
vitest_1.vi.mock('../processors/rawDataProcessor', () => ({
    processJobRawData: vitest_1.vi.fn(),
}));
const jobService = __importStar(require("../services/scraperJobService"));
const rawDataProcessor = __importStar(require("../processors/rawDataProcessor"));
const mockCreateJob = jobService.createJob;
const mockUpdateJob = jobService.updateJob;
const mockCompleteJob = jobService.completeJob;
const mockFailJob = jobService.failJob;
const mockProcessJobRawData = rawDataProcessor.processJobRawData;
class MockScraper extends baseScraper_1.BaseScraper {
    constructor(items = [], shouldThrow = false) {
        super('TEST', { delayMs: 0 });
        this.items = items;
        this.shouldThrow = shouldThrow;
    }
    async scrape() {
        if (this.shouldThrow)
            throw new Error('Scraper network error');
        return this.items;
    }
    async saveRaw(_items, _jobId) {
        return this.items.length;
    }
}
(0, vitest_1.describe)('scraperOrchestrator', () => {
    const mockJob = { id: 'job-uuid-1', source: 'JIJI', status: 'queued' };
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockCreateJob.mockResolvedValue(mockJob);
        mockUpdateJob.mockResolvedValue({});
        mockCompleteJob.mockResolvedValue({});
        mockFailJob.mockResolvedValue({});
        mockProcessJobRawData.mockResolvedValue({ inserted: 5, skipped: 1, processed: 6, errors: 0 });
    });
    (0, vitest_1.describe)('runScraper', () => {
        (0, vitest_1.it)('creates a job before running', async () => {
            (0, scraperOrchestrator_1.registerScraper)('JIJI', () => new MockScraper([], false));
            await (0, scraperOrchestrator_1.runScraper)('JIJI', 'manual');
            (0, vitest_1.expect)(mockCreateJob).toHaveBeenCalledWith('JIJI', 'manual');
        });
        (0, vitest_1.it)('marks job as running with started_at', async () => {
            (0, scraperOrchestrator_1.registerScraper)('JIJI', () => new MockScraper());
            await (0, scraperOrchestrator_1.runScraper)('JIJI', 'manual');
            (0, vitest_1.expect)(mockUpdateJob).toHaveBeenCalledWith('job-uuid-1', vitest_1.expect.objectContaining({ status: 'running', started_at: vitest_1.expect.any(Date) }));
        });
        (0, vitest_1.it)('calls rawDataProcessor after scraping', async () => {
            (0, scraperOrchestrator_1.registerScraper)('JIJI', () => new MockScraper([{ source: 'JIJI', vin: null, plate: null, raw_data: {} }]));
            await (0, scraperOrchestrator_1.runScraper)('JIJI', 'scheduled');
            (0, vitest_1.expect)(mockProcessJobRawData).toHaveBeenCalledWith('job-uuid-1');
        });
        (0, vitest_1.it)('completes job with correct counts', async () => {
            const items = [
                { source: 'JIJI', vin: null, plate: null, raw_data: {} },
                { source: 'JIJI', vin: null, plate: null, raw_data: {} },
            ];
            (0, scraperOrchestrator_1.registerScraper)('JIJI', () => new MockScraper(items));
            await (0, scraperOrchestrator_1.runScraper)('JIJI');
            (0, vitest_1.expect)(mockCompleteJob).toHaveBeenCalledWith('job-uuid-1', vitest_1.expect.objectContaining({ items_found: 2, items_stored: 2, items_skipped: 0 }));
        });
        (0, vitest_1.it)('returns result with processor counts', async () => {
            (0, scraperOrchestrator_1.registerScraper)('JIJI', () => new MockScraper([]));
            const result = await (0, scraperOrchestrator_1.runScraper)('JIJI');
            (0, vitest_1.expect)(result.processor_inserted).toBe(5);
            (0, vitest_1.expect)(result.processor_skipped).toBe(1);
        });
        (0, vitest_1.it)('fails job and returns error when scraper throws', async () => {
            (0, scraperOrchestrator_1.registerScraper)('JIJI', () => new MockScraper([], true));
            const result = await (0, scraperOrchestrator_1.runScraper)('JIJI');
            (0, vitest_1.expect)(mockFailJob).toHaveBeenCalledWith('job-uuid-1', 'Scraper network error');
            (0, vitest_1.expect)(result.error).toBe('Scraper network error');
            (0, vitest_1.expect)(result.items_found).toBe(0);
        });
        (0, vitest_1.it)('throws when source is not registered', async () => {
            await (0, vitest_1.expect)((0, scraperOrchestrator_1.runScraper)('STC_JAPAN')).rejects.toThrow('No scraper registered for source: STC_JAPAN');
        });
    });
    (0, vitest_1.describe)('registerScraper', () => {
        (0, vitest_1.it)('adds new scraper to registry', () => {
            const before = (0, scraperOrchestrator_1.getRegisteredSources)().length;
            // Re-register existing doesn't add duplicate
            (0, scraperOrchestrator_1.registerScraper)('JIJI', () => new MockScraper());
            (0, vitest_1.expect)((0, scraperOrchestrator_1.getRegisteredSources)().length).toBe(before);
        });
    });
});
