"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/__tests__/duplicateResolver.test.ts
const vitest_1 = require("vitest");
const duplicateResolver_1 = require("../processors/duplicateResolver");
vitest_1.vi.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        vehicle_events: {
            findFirst: vitest_1.vi.fn(),
        },
    },
}));
const prisma_1 = __importDefault(require("../lib/prisma"));
const mockPrisma = prisma_1.default;
const baseCandidate = {
    vin: 'JTDBR32E540012345',
    event_type: 'SERVICED',
    event_date: new Date('2024-06-15'),
    source_ref: 'svc-001',
};
(0, vitest_1.describe)('duplicateResolver', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.describe)('isDuplicateEvent', () => {
        (0, vitest_1.it)('returns false when no matching event exists', async () => {
            mockPrisma.vehicle_events.findFirst.mockResolvedValue(null);
            const result = await (0, duplicateResolver_1.isDuplicateEvent)(baseCandidate);
            (0, vitest_1.expect)(result).toBe(false);
        });
        (0, vitest_1.it)('returns true when matching event exists within 30-day window', async () => {
            mockPrisma.vehicle_events.findFirst.mockResolvedValue({ id: 'existing-event' });
            const result = await (0, duplicateResolver_1.isDuplicateEvent)(baseCandidate);
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('queries with correct date window (±30 days)', async () => {
            mockPrisma.vehicle_events.findFirst.mockResolvedValue(null);
            await (0, duplicateResolver_1.isDuplicateEvent)(baseCandidate);
            const call = mockPrisma.vehicle_events.findFirst.mock.calls[0][0];
            const { gte, lte } = call.where.event_date;
            const diffStart = baseCandidate.event_date.getTime() - gte.getTime();
            const diffEnd = lte.getTime() - baseCandidate.event_date.getTime();
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
            (0, vitest_1.expect)(Math.abs(diffStart - thirtyDaysMs)).toBeLessThan(1000);
            (0, vitest_1.expect)(Math.abs(diffEnd - thirtyDaysMs)).toBeLessThan(1000);
        });
        (0, vitest_1.it)('includes source_ref in query when provided', async () => {
            mockPrisma.vehicle_events.findFirst.mockResolvedValue(null);
            await (0, duplicateResolver_1.isDuplicateEvent)(baseCandidate);
            const call = mockPrisma.vehicle_events.findFirst.mock.calls[0][0];
            (0, vitest_1.expect)(call.where.source_ref).toBe('svc-001');
        });
        (0, vitest_1.it)('omits source_ref from query when null', async () => {
            mockPrisma.vehicle_events.findFirst.mockResolvedValue(null);
            await (0, duplicateResolver_1.isDuplicateEvent)({ ...baseCandidate, source_ref: null });
            const call = mockPrisma.vehicle_events.findFirst.mock.calls[0][0];
            (0, vitest_1.expect)(call.where.source_ref).toBeUndefined();
        });
        (0, vitest_1.it)('new events more than 30 days apart are not duplicates', async () => {
            // findFirst returns null = no match in window = not duplicate
            mockPrisma.vehicle_events.findFirst.mockResolvedValue(null);
            const result = await (0, duplicateResolver_1.isDuplicateEvent)({
                vin: 'JTDBR32E540012345',
                event_type: 'SERVICED',
                event_date: new Date('2024-01-01'),
                source_ref: 'svc-001',
            });
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('filterDuplicateEvents', () => {
        (0, vitest_1.it)('filters out duplicate events, keeps new ones', async () => {
            const candidates = [
                { ...baseCandidate, source_ref: 'svc-001' },
                { ...baseCandidate, source_ref: 'svc-002', event_type: 'LISTED_FOR_SALE' },
                { ...baseCandidate, source_ref: 'svc-003' },
            ];
            // First is duplicate, second and third are not
            mockPrisma.vehicle_events.findFirst
                .mockResolvedValueOnce({ id: 'existing' }) // svc-001 = dupe
                .mockResolvedValueOnce(null) // svc-002 = new
                .mockResolvedValueOnce(null); // svc-003 = new
            const result = await (0, duplicateResolver_1.filterDuplicateEvents)(candidates);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0].source_ref).toBe('svc-002');
            (0, vitest_1.expect)(result[1].source_ref).toBe('svc-003');
        });
        (0, vitest_1.it)('returns empty array when all are duplicates', async () => {
            mockPrisma.vehicle_events.findFirst.mockResolvedValue({ id: 'existing' });
            const result = await (0, duplicateResolver_1.filterDuplicateEvents)([baseCandidate, baseCandidate]);
            (0, vitest_1.expect)(result).toHaveLength(0);
        });
        (0, vitest_1.it)('returns all when none are duplicates', async () => {
            mockPrisma.vehicle_events.findFirst.mockResolvedValue(null);
            const candidates = [
                { ...baseCandidate, source_ref: 'a' },
                { ...baseCandidate, source_ref: 'b' },
            ];
            const result = await (0, duplicateResolver_1.filterDuplicateEvents)(candidates);
            (0, vitest_1.expect)(result).toHaveLength(2);
        });
    });
});
