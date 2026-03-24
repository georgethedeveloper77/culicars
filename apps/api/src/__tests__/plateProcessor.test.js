"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/__tests__/plateProcessor.test.ts
const vitest_1 = require("vitest");
const plateProcessor_1 = require("../processors/plateProcessor");
vitest_1.vi.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        plate_vin_map: {
            findFirst: vitest_1.vi.fn(),
            create: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
        },
    },
}));
const prisma_1 = __importDefault(require("../lib/prisma"));
const mockPrisma = prisma_1.default;
(0, vitest_1.describe)('plateProcessor', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.describe)('normalizePlate', () => {
        (0, vitest_1.it)('removes spaces and uppercases', () => {
            (0, vitest_1.expect)((0, plateProcessor_1.normalizePlate)('kca 123a')).toBe('KCA123A');
            (0, vitest_1.expect)((0, plateProcessor_1.normalizePlate)('KCA 123A')).toBe('KCA123A');
            (0, vitest_1.expect)((0, plateProcessor_1.normalizePlate)('  KCA  123A  ')).toBe('KCA123A');
        });
        (0, vitest_1.it)('handles plates without spaces', () => {
            (0, vitest_1.expect)((0, plateProcessor_1.normalizePlate)('KCA123A')).toBe('KCA123A');
        });
    });
    (0, vitest_1.describe)('formatPlate', () => {
        (0, vitest_1.it)('formats standard Kenya plate KXX 000X', () => {
            (0, vitest_1.expect)((0, plateProcessor_1.formatPlate)('KCA123A')).toBe('KCA 123A');
        });
        (0, vitest_1.it)('formats old plate KXX 000', () => {
            (0, vitest_1.expect)((0, plateProcessor_1.formatPlate)('KCA123')).toBe('KCA 123');
        });
        (0, vitest_1.it)('formats government plates', () => {
            (0, vitest_1.expect)((0, plateProcessor_1.formatPlate)('GK1234')).toBe('GK 1234');
            (0, vitest_1.expect)((0, plateProcessor_1.formatPlate)('CD123')).toBe('CD 123');
        });
    });
    (0, vitest_1.describe)('processPlate', () => {
        const plateData = {
            plate: 'KCA123A',
            plate_display: 'KCA 123A',
            vin: 'JTDBR32E540012345',
            confidence: 0.85,
            source: 'scraper_jiji',
        };
        (0, vitest_1.it)('creates new plate mapping when none exists', async () => {
            mockPrisma.plate_vin_map.findFirst.mockResolvedValue(null);
            mockPrisma.plate_vin_map.create.mockResolvedValue({ id: 'new-id' });
            await (0, plateProcessor_1.processPlate)(plateData);
            (0, vitest_1.expect)(mockPrisma.plate_vin_map.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                data: vitest_1.expect.objectContaining({
                    plate: 'KCA123A',
                    vin: 'JTDBR32E540012345',
                    confidence: 0.85,
                }),
            }));
        });
        (0, vitest_1.it)('does not update when existing confidence is higher', async () => {
            mockPrisma.plate_vin_map.findFirst.mockResolvedValue({
                id: 'existing-id',
                confidence: 1.0, // NTSA COR - highest
            });
            await (0, plateProcessor_1.processPlate)({ ...plateData, confidence: 0.5 });
            (0, vitest_1.expect)(mockPrisma.plate_vin_map.update).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)('updates when incoming confidence is higher', async () => {
            mockPrisma.plate_vin_map.findFirst.mockResolvedValue({
                id: 'existing-id',
                confidence: 0.5,
                verified_at: null,
            });
            mockPrisma.plate_vin_map.update.mockResolvedValue({});
            await (0, plateProcessor_1.processPlate)({ ...plateData, confidence: 0.9 });
            (0, vitest_1.expect)(mockPrisma.plate_vin_map.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                where: { id: 'existing-id' },
                data: vitest_1.expect.objectContaining({ confidence: 0.9 }),
            }));
        });
        (0, vitest_1.it)('sets verified_at for confidence >= 0.9', async () => {
            mockPrisma.plate_vin_map.findFirst.mockResolvedValue(null);
            mockPrisma.plate_vin_map.create.mockResolvedValue({});
            await (0, plateProcessor_1.processPlate)({ ...plateData, confidence: 0.9 });
            (0, vitest_1.expect)(mockPrisma.plate_vin_map.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                data: vitest_1.expect.objectContaining({ verified_at: vitest_1.expect.any(Date) }),
            }));
        });
        (0, vitest_1.it)('does not set verified_at for confidence < 0.9', async () => {
            mockPrisma.plate_vin_map.findFirst.mockResolvedValue(null);
            mockPrisma.plate_vin_map.create.mockResolvedValue({});
            await (0, plateProcessor_1.processPlate)({ ...plateData, confidence: 0.5 });
            (0, vitest_1.expect)(mockPrisma.plate_vin_map.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                data: vitest_1.expect.objectContaining({ verified_at: null }),
            }));
        });
    });
});
