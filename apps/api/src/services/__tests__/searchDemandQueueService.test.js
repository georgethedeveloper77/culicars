"use strict";
// apps/api/src/services/__tests__/searchDemandQueueService.test.ts
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('@culicars/database', () => ({
    prisma: {
        $executeRaw: vitest_1.vi.fn().mockResolvedValue(1),
        $queryRawUnsafe: vitest_1.vi.fn(),
    },
}));
const database_1 = require("@culicars/database");
const searchDemandQueueService_1 = require("../searchDemandQueueService");
(0, vitest_1.describe)('searchDemandQueueService', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.describe)('enqueue', () => {
        (0, vitest_1.it)('calls $executeRaw for a vin-keyed entry', async () => {
            await (0, searchDemandQueueService_1.enqueue)({ vin: 'TESTVIN123', plate: null, resultState: 'pending_enrichment' });
            (0, vitest_1.expect)(vitest_1.vi.mocked(database_1.prisma.$executeRaw)).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('calls $executeRaw for a plate-keyed entry when no vin', async () => {
            await (0, searchDemandQueueService_1.enqueue)({ plate: 'KCA 123A', vin: null, resultState: 'low_confidence' });
            (0, vitest_1.expect)(vitest_1.vi.mocked(database_1.prisma.$executeRaw)).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('does not call DB when neither plate nor vin provided', async () => {
            await (0, searchDemandQueueService_1.enqueue)({ resultState: 'pending_enrichment' });
            (0, vitest_1.expect)(vitest_1.vi.mocked(database_1.prisma.$executeRaw)).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('does not throw when DB call fails', async () => {
            vitest_1.vi.mocked(database_1.prisma.$executeRaw).mockRejectedValueOnce(new Error('DB down'));
            await (0, vitest_1.expect)((0, searchDemandQueueService_1.enqueue)({ vin: 'ABC', resultState: 'pending_enrichment' })).resolves.toBeUndefined();
        });
    });
    (0, vitest_1.describe)('markEnriched', () => {
        (0, vitest_1.it)('calls $executeRaw with vin', async () => {
            await (0, searchDemandQueueService_1.markEnriched)({ vin: 'TESTVIN123' });
            (0, vitest_1.expect)(vitest_1.vi.mocked(database_1.prisma.$executeRaw)).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('does not throw on DB failure', async () => {
            vitest_1.vi.mocked(database_1.prisma.$executeRaw).mockRejectedValueOnce(new Error('DB error'));
            await (0, vitest_1.expect)((0, searchDemandQueueService_1.markEnriched)({ vin: 'ABC' })).resolves.toBeUndefined();
        });
    });
    (0, vitest_1.describe)('listQueue', () => {
        (0, vitest_1.it)('returns entries, total, page, and pageSize from DB', async () => {
            const mockEntries = [{
                    id: '1', plate: 'KCA 123A', vin: null,
                    resultState: 'pending_enrichment', timesRequested: 3,
                    lastRequestedAt: new Date(), enrichedAt: null, createdAt: new Date(),
                }];
            vitest_1.vi.mocked(database_1.prisma.$queryRawUnsafe)
                .mockResolvedValueOnce(mockEntries)
                .mockResolvedValueOnce([{ count: BigInt(1) }]);
            const result = await (0, searchDemandQueueService_1.listQueue)({ page: 1, pageSize: 25 });
            (0, vitest_1.expect)(result.entries).toHaveLength(1);
            (0, vitest_1.expect)(result.total).toBe(1);
            (0, vitest_1.expect)(result.page).toBe(1);
            (0, vitest_1.expect)(result.pageSize).toBe(25);
            (0, vitest_1.expect)(result.entries[0].plate).toBe('KCA 123A');
        });
        (0, vitest_1.it)('applies default pagination when no params given', async () => {
            vitest_1.vi.mocked(database_1.prisma.$queryRawUnsafe)
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([{ count: BigInt(0) }]);
            const result = await (0, searchDemandQueueService_1.listQueue)({});
            (0, vitest_1.expect)(result.page).toBe(1);
            (0, vitest_1.expect)(result.pageSize).toBe(25);
            (0, vitest_1.expect)(result.total).toBe(0);
        });
    });
});
