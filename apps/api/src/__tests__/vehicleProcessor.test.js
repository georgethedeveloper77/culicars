"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/__tests__/vehicleProcessor.test.ts
const vitest_1 = require("vitest");
const vehicleProcessor_1 = require("../processors/vehicleProcessor");
vitest_1.vi.mock('../lib/prisma', () => ({
    __esModule: true,
    default: {
        vehicles: {
            findUnique: vitest_1.vi.fn(),
            create: vitest_1.vi.fn(),
            update: vitest_1.vi.fn(),
        },
    },
}));
const prisma_1 = __importDefault(require("../lib/prisma"));
const mockPrisma = prisma_1.default;
const baseVehicle = {
    vin: 'JTDBR32E540012345',
    make: 'Toyota',
    model: 'Fielder',
    year: 2014,
    confidence: 0.5,
};
(0, vitest_1.describe)('vehicleProcessor', () => {
    (0, vitest_1.beforeEach)(() => vitest_1.vi.clearAllMocks());
    (0, vitest_1.describe)('new vehicle (create path)', () => {
        (0, vitest_1.it)('creates vehicle when VIN not in DB', async () => {
            mockPrisma.vehicles.findUnique.mockResolvedValue(null);
            mockPrisma.vehicles.create.mockResolvedValue({ vin: baseVehicle.vin });
            await (0, vehicleProcessor_1.processVehicle)(baseVehicle);
            (0, vitest_1.expect)(mockPrisma.vehicles.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                data: vitest_1.expect.objectContaining({ vin: 'JTDBR32E540012345', make: 'Toyota', model: 'Fielder' }),
            }));
        });
        (0, vitest_1.it)('stores japan_auction_grade on create', async () => {
            mockPrisma.vehicles.findUnique.mockResolvedValue(null);
            mockPrisma.vehicles.create.mockResolvedValue({});
            await (0, vehicleProcessor_1.processVehicle)({ ...baseVehicle, japan_auction_grade: '4', confidence: 0.85 });
            (0, vitest_1.expect)(mockPrisma.vehicles.create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                data: vitest_1.expect.objectContaining({ japan_auction_grade: '4' }),
            }));
        });
    });
    (0, vitest_1.describe)('existing vehicle (update path)', () => {
        const existingVehicle = {
            vin: 'JTDBR32E540012345',
            make: 'Toyota',
            model: 'Fielder',
            year: 2014,
            engine_cc: null,
            fuel_type: null,
            transmission: null,
            body_type: null,
            color: null,
            country_of_origin: null,
            japan_auction_grade: null,
            japan_auction_mileage: null,
        };
        (0, vitest_1.it)('fills in null fields regardless of confidence', async () => {
            mockPrisma.vehicles.findUnique.mockResolvedValue(existingVehicle);
            mockPrisma.vehicles.update.mockResolvedValue({});
            await (0, vehicleProcessor_1.processVehicle)({ ...baseVehicle, engine_cc: 1500, confidence: 0.5 });
            (0, vitest_1.expect)(mockPrisma.vehicles.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                data: vitest_1.expect.objectContaining({ engine_cc: 1500 }),
            }));
        });
        (0, vitest_1.it)('low confidence (listing) does NOT overwrite existing non-null make', async () => {
            mockPrisma.vehicles.findUnique.mockResolvedValue({
                ...existingVehicle,
                make: 'Toyota', // already set
            });
            mockPrisma.vehicles.update.mockResolvedValue({});
            await (0, vehicleProcessor_1.processVehicle)({ ...baseVehicle, make: 'Honda', confidence: 0.5 });
            // make was already set, low confidence shouldn't overwrite
            const updateCall = mockPrisma.vehicles.update.mock.calls[0];
            if (updateCall) {
                const updateData = updateCall[0].data;
                (0, vitest_1.expect)(updateData.make).toBeUndefined();
            }
            else {
                // No update call = correctly skipped
                (0, vitest_1.expect)(mockPrisma.vehicles.update).not.toHaveBeenCalledWith(vitest_1.expect.objectContaining({ data: vitest_1.expect.objectContaining({ make: 'Honda' }) }));
            }
        });
        (0, vitest_1.it)('BE FORWARD grade (0.85) sets japan_auction_grade when empty', async () => {
            mockPrisma.vehicles.findUnique.mockResolvedValue(existingVehicle);
            mockPrisma.vehicles.update.mockResolvedValue({});
            await (0, vehicleProcessor_1.processVehicle)({ ...baseVehicle, japan_auction_grade: '4.5', confidence: 0.85 });
            (0, vitest_1.expect)(mockPrisma.vehicles.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                data: vitest_1.expect.objectContaining({ japan_auction_grade: '4.5' }),
            }));
        });
        (0, vitest_1.it)('BE FORWARD grade (0.85) overwrites existing lower-source grade', async () => {
            mockPrisma.vehicles.findUnique.mockResolvedValue({
                ...existingVehicle,
                japan_auction_grade: '3',
            });
            mockPrisma.vehicles.update.mockResolvedValue({});
            await (0, vehicleProcessor_1.processVehicle)({ ...baseVehicle, japan_auction_grade: '4.5', confidence: 0.85 });
            (0, vitest_1.expect)(mockPrisma.vehicles.update).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
                data: vitest_1.expect.objectContaining({ japan_auction_grade: '4.5' }),
            }));
        });
        (0, vitest_1.it)('low confidence source does NOT overwrite existing japan_auction_grade', async () => {
            mockPrisma.vehicles.findUnique.mockResolvedValue({
                ...existingVehicle,
                japan_auction_grade: '4',
            });
            mockPrisma.vehicles.update.mockResolvedValue({});
            await (0, vehicleProcessor_1.processVehicle)({ ...baseVehicle, japan_auction_grade: '2', confidence: 0.5 });
            const updateCall = mockPrisma.vehicles.update.mock.calls[0];
            if (updateCall) {
                (0, vitest_1.expect)(updateCall[0].data.japan_auction_grade).toBeUndefined();
            }
        });
        (0, vitest_1.it)('does not call update when no fields changed', async () => {
            mockPrisma.vehicles.findUnique.mockResolvedValue({
                ...existingVehicle,
                make: 'Toyota',
                model: 'Fielder',
                year: 2014,
            });
            // All incoming fields already set, no nulls to fill
            await (0, vehicleProcessor_1.processVehicle)({ vin: baseVehicle.vin, confidence: 0.5 });
            (0, vitest_1.expect)(mockPrisma.vehicles.update).not.toHaveBeenCalled();
        });
    });
});
