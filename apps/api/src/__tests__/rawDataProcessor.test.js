"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/__tests__/rawDataProcessor.test.ts
const vitest_1 = require("vitest");
const rawDataProcessor_1 = require("../processors/rawDataProcessor");
vitest_1.vi.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        scraper_data_raw: {
            findMany: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
            groupBy: vitest_1.vi.fn(),
        },
    },
}));
vitest_1.vi.mock('../processors/serviceRecordProcessor', () => ({
    processServiceRecord: vitest_1.vi.fn().mockResolvedValue(true),
}));
vitest_1.vi.mock('../processors/listingProcessor', () => ({
    processListing: vitest_1.vi.fn().mockResolvedValue(true),
}));
vitest_1.vi.mock('../processors/auctionProcessor', () => ({
    processAuction: vitest_1.vi.fn().mockResolvedValue(true),
}));
vitest_1.vi.mock('../processors/vinNormalizer', () => ({
    normalizeVin: vitest_1.vi.fn((v) => v),
}));
const prisma_1 = __importDefault(require("../lib/prisma"));
const listingProcessor_1 = require("../processors/listingProcessor");
const auctionProcessor_1 = require("../processors/auctionProcessor");
const serviceRecordProcessor_1 = require("../processors/serviceRecordProcessor");
const mockPrisma = prisma_1.default;
const makeRow = (id, source, extra = {}) => ({
    id,
    job_id: 'job-abc',
    source,
    vin: null,
    plate: null,
    processed: false,
    created_at: new Date(),
    raw_data: { title: 'Test Vehicle', confidence: 0.5, event_type: 'LISTED_FOR_SALE', ...extra },
});
(0, vitest_1.describe)('rawDataProcessor', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.it)('routes JIJI rows to listingProcessor', async () => {
        mockPrisma.scraper_data_raw.findMany.mockResolvedValue([
            makeRow('row-1', 'JIJI'),
        ]);
        mockPrisma.scraper_data_raw.update.mockResolvedValue({});
        await (0, rawDataProcessor_1.processJobRawData)('job-abc');
        (0, vitest_1.expect)(listingProcessor_1.processListing).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(auctionProcessor_1.processAuction).not.toHaveBeenCalled();
        (0, vitest_1.expect)(serviceRecordProcessor_1.processServiceRecord).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('routes AUTO_EXPRESS rows to serviceRecordProcessor', async () => {
        mockPrisma.scraper_data_raw.findMany.mockResolvedValue([
            makeRow('row-1', 'AUTO_EXPRESS'),
        ]);
        mockPrisma.scraper_data_raw.update.mockResolvedValue({});
        await (0, rawDataProcessor_1.processJobRawData)('job-abc');
        (0, vitest_1.expect)(serviceRecordProcessor_1.processServiceRecord).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('routes BEFORWARD rows to auctionProcessor', async () => {
        mockPrisma.scraper_data_raw.findMany.mockResolvedValue([
            makeRow('row-1', 'BEFORWARD'),
        ]);
        mockPrisma.scraper_data_raw.update.mockResolvedValue({});
        await (0, rawDataProcessor_1.processJobRawData)('job-abc');
        (0, vitest_1.expect)(auctionProcessor_1.processAuction).toHaveBeenCalledTimes(1);
    });
    (0, vitest_1.it)('marks each row as processed=true after handling', async () => {
        mockPrisma.scraper_data_raw.findMany.mockResolvedValue([
            makeRow('row-1', 'JIJI'),
            makeRow('row-2', 'KRA_IBID'),
        ]);
        mockPrisma.scraper_data_raw.update.mockResolvedValue({});
        await (0, rawDataProcessor_1.processJobRawData)('job-abc');
        (0, vitest_1.expect)(mockPrisma.scraper_data_raw.update).toHaveBeenCalledTimes(2);
        (0, vitest_1.expect)(mockPrisma.scraper_data_raw.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: { id: 'row-1' },
            data: vitest_1.expect.objectContaining({ processed: true, processed_at: vitest_1.expect.any(Date) }),
        }));
        (0, vitest_1.expect)(mockPrisma.scraper_data_raw.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            where: { id: 'row-2' },
            data: vitest_1.expect.objectContaining({ processed: true }),
        }));
    });
    (0, vitest_1.it)('marks row as processed even when sub-processor throws', async () => {
        mockPrisma.scraper_data_raw.findMany.mockResolvedValue([
            makeRow('row-err', 'JIJI'),
        ]);
        mockPrisma.scraper_data_raw.update.mockResolvedValue({});
        listingProcessor_1.processListing.mockRejectedValueOnce(new Error('DB error'));
        const result = await (0, rawDataProcessor_1.processJobRawData)('job-abc');
        (0, vitest_1.expect)(result.errors).toBe(1);
        (0, vitest_1.expect)(mockPrisma.scraper_data_raw.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ where: { id: 'row-err' } }));
    });
    (0, vitest_1.it)('returns correct counts', async () => {
        mockPrisma.scraper_data_raw.findMany.mockResolvedValue([
            makeRow('row-1', 'JIJI'),
            makeRow('row-2', 'PIGIAME'),
            makeRow('row-3', 'BEFORWARD'),
        ]);
        mockPrisma.scraper_data_raw.update.mockResolvedValue({});
        listingProcessor_1.processListing.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
        auctionProcessor_1.processAuction.mockResolvedValueOnce(true);
        const result = await (0, rawDataProcessor_1.processJobRawData)('job-abc');
        (0, vitest_1.expect)(result.processed).toBe(3);
        (0, vitest_1.expect)(result.inserted).toBe(2); // row-1 and row-3
        (0, vitest_1.expect)(result.skipped).toBe(1); // row-2 (dupe)
        (0, vitest_1.expect)(result.errors).toBe(0);
    });
});
