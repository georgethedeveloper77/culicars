// apps/api/src/__tests__/plateProcessor.test.ts
import { vi, describe, it, expect, beforeEach, type Mocked, type MockInstance } from 'vitest';
import { processPlate, normalizePlate, formatPlate } from '../processors/plateProcessor';

vi.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    plateVinMap: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
const mockPrisma = prisma as Mocked<typeof prisma>;

describe('plateProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('normalizePlate', () => {
    it('removes spaces and uppercases', () => {
      expect(normalizePlate('kca 123a')).toBe('KCA123A');
      expect(normalizePlate('KCA 123A')).toBe('KCA123A');
      expect(normalizePlate('  KCA  123A  ')).toBe('KCA123A');
    });

    it('handles plates without spaces', () => {
      expect(normalizePlate('KCA123A')).toBe('KCA123A');
    });
  });

  describe('formatPlate', () => {
    it('formats standard Kenya plate KXX 000X', () => {
      expect(formatPlate('KCA123A')).toBe('KCA 123A');
    });

    it('formats old plate KXX 000', () => {
      expect(formatPlate('KCA123')).toBe('KCA 123');
    });

    it('formats government plates', () => {
      expect(formatPlate('GK1234')).toBe('GK 1234');
      expect(formatPlate('CD123')).toBe('CD 123');
    });
  });

  describe('processPlate', () => {
    const plateData = {
      plate: 'KCA123A',
      plate_display: 'KCA 123A',
      vin: 'JTDBR32E540012345',
      confidence: 0.85,
      source: 'scraper_jiji',
    };

    it('creates new plate mapping when none exists', async () => {
      (mockPrisma.plateVinMap.findFirst as MockInstance).mockResolvedValue(null);
      (mockPrisma.plateVinMap.create as MockInstance).mockResolvedValue({ id: 'new-id' });

      await processPlate(plateData);

      expect(mockPrisma.plateVinMap.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            plate: 'KCA123A',
            vin: 'JTDBR32E540012345',
            confidence: 0.85,
          }),
        })
      );
    });

    it('does not update when existing confidence is higher', async () => {
      (mockPrisma.plateVinMap.findFirst as MockInstance).mockResolvedValue({
        id: 'existing-id',
        confidence: 1.0, // NTSA COR - highest
      });

      await processPlate({ ...plateData, confidence: 0.5 });

      expect(mockPrisma.plateVinMap.update).not.toHaveBeenCalled();
    });

    it('updates when incoming confidence is higher', async () => {
      (mockPrisma.plateVinMap.findFirst as MockInstance).mockResolvedValue({
        id: 'existing-id',
        confidence: 0.5,
        verifiedAt: null,
      });
      (mockPrisma.plateVinMap.update as MockInstance).mockResolvedValue({});

      await processPlate({ ...plateData, confidence: 0.9 });

      expect(mockPrisma.plateVinMap.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'existing-id' },
          data: expect.objectContaining({ confidence: 0.9 }),
        })
      );
    });

    it('sets verifiedAt for confidence >= 0.9', async () => {
      (mockPrisma.plateVinMap.findFirst as MockInstance).mockResolvedValue(null);
      (mockPrisma.plateVinMap.create as MockInstance).mockResolvedValue({});

      await processPlate({ ...plateData, confidence: 0.9 });

      expect(mockPrisma.plateVinMap.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ verifiedAt: expect.any(Date) }),
        })
      );
    });

    it('does not set verifiedAt for confidence < 0.9', async () => {
      (mockPrisma.plateVinMap.findFirst as MockInstance).mockResolvedValue(null);
      (mockPrisma.plateVinMap.create as MockInstance).mockResolvedValue({});

      await processPlate({ ...plateData, confidence: 0.5 });

      expect(mockPrisma.plateVinMap.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ verifiedAt: null }),
        })
      );
    });
  });
});
