// apps/api/src/__tests__/vehicleProcessor.test.ts
import { vi, describe, it, expect, beforeEach, type Mocked, type MockInstance } from 'vitest';
import { processVehicle, VehicleData } from '../processors/vehicleProcessor';

vi.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    vehicles: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
const mockPrisma = prisma as Mocked<typeof prisma>;

const baseVehicle: VehicleData = {
  vin: 'JTDBR32E540012345',
  make: 'Toyota',
  model: 'Fielder',
  year: 2014,
  confidence: 0.5,
};

describe('vehicleProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('new vehicle (create path)', () => {
    it('creates vehicle when VIN not in DB', async () => {
      (mockPrisma.vehicles.findUnique as MockInstance).mockResolvedValue(null);
      (mockPrisma.vehicles.create as MockInstance).mockResolvedValue({ vin: baseVehicle.vin });

      await processVehicle(baseVehicle);

      expect(mockPrisma.vehicles.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ vin: 'JTDBR32E540012345', make: 'Toyota', model: 'Fielder' }),
        })
      );
    });

    it('stores japan_auction_grade on create', async () => {
      (mockPrisma.vehicles.findUnique as MockInstance).mockResolvedValue(null);
      (mockPrisma.vehicles.create as MockInstance).mockResolvedValue({});

      await processVehicle({ ...baseVehicle, japan_auction_grade: '4', confidence: 0.85 });

      expect(mockPrisma.vehicles.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ japan_auction_grade: '4' }),
        })
      );
    });
  });

  describe('existing vehicle (update path)', () => {
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

    it('fills in null fields regardless of confidence', async () => {
      (mockPrisma.vehicles.findUnique as MockInstance).mockResolvedValue(existingVehicle);
      (mockPrisma.vehicles.update as MockInstance).mockResolvedValue({});

      await processVehicle({ ...baseVehicle, engine_cc: 1500, confidence: 0.5 });

      expect(mockPrisma.vehicles.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ engine_cc: 1500 }),
        })
      );
    });

    it('low confidence (listing) does NOT overwrite existing non-null make', async () => {
      (mockPrisma.vehicles.findUnique as MockInstance).mockResolvedValue({
        ...existingVehicle,
        make: 'Toyota', // already set
      });
      (mockPrisma.vehicles.update as MockInstance).mockResolvedValue({});

      await processVehicle({ ...baseVehicle, make: 'Honda', confidence: 0.5 });

      // make was already set, low confidence shouldn't overwrite
      const updateCall = (mockPrisma.vehicles.update as MockInstance).mock.calls[0];
      if (updateCall) {
        const updateData = updateCall[0].data;
        expect(updateData.make).toBeUndefined();
      } else {
        // No update call = correctly skipped
        expect(mockPrisma.vehicles.update).not.toHaveBeenCalledWith(
          expect.objectContaining({ data: expect.objectContaining({ make: 'Honda' }) })
        );
      }
    });

    it('BE FORWARD grade (0.85) sets japan_auction_grade when empty', async () => {
      (mockPrisma.vehicles.findUnique as MockInstance).mockResolvedValue(existingVehicle);
      (mockPrisma.vehicles.update as MockInstance).mockResolvedValue({});

      await processVehicle({ ...baseVehicle, japan_auction_grade: '4.5', confidence: 0.85 });

      expect(mockPrisma.vehicles.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ japan_auction_grade: '4.5' }),
        })
      );
    });

    it('BE FORWARD grade (0.85) overwrites existing lower-source grade', async () => {
      (mockPrisma.vehicles.findUnique as MockInstance).mockResolvedValue({
        ...existingVehicle,
        japan_auction_grade: '3',
      });
      (mockPrisma.vehicles.update as MockInstance).mockResolvedValue({});

      await processVehicle({ ...baseVehicle, japan_auction_grade: '4.5', confidence: 0.85 });

      expect(mockPrisma.vehicles.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ japan_auction_grade: '4.5' }),
        })
      );
    });

    it('low confidence source does NOT overwrite existing japan_auction_grade', async () => {
      (mockPrisma.vehicles.findUnique as MockInstance).mockResolvedValue({
        ...existingVehicle,
        japan_auction_grade: '4',
      });
      (mockPrisma.vehicles.update as MockInstance).mockResolvedValue({});

      await processVehicle({ ...baseVehicle, japan_auction_grade: '2', confidence: 0.5 });

      const updateCall = (mockPrisma.vehicles.update as MockInstance).mock.calls[0];
      if (updateCall) {
        expect(updateCall[0].data.japan_auction_grade).toBeUndefined();
      }
    });

    it('does not call update when no fields changed', async () => {
      (mockPrisma.vehicles.findUnique as MockInstance).mockResolvedValue({
        ...existingVehicle,
        make: 'Toyota',
        model: 'Fielder',
        year: 2014,
      });

      // All incoming fields already set, no nulls to fill
      await processVehicle({ vin: baseVehicle.vin, confidence: 0.5 });

      expect(mockPrisma.vehicles.update).not.toHaveBeenCalled();
    });
  });
});
