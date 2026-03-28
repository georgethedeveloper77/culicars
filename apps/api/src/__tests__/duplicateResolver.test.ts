// apps/api/src/__tests__/duplicateResolver.test.ts
import { vi, describe, it, expect, beforeEach, type Mocked, type MockInstance } from 'vitest';
import { isDuplicateEvent, filterDuplicateEvents } from '../processors/duplicateResolver';

vi.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    vehicleEvent: {
      findFirst: vi.fn(),
    },
  },
}));

import prisma from '../lib/prisma';
const mockPrisma = prisma as Mocked<typeof prisma>;

const baseCandidate = {
  vin: 'JTDBR32E540012345',
  event_type: 'SERVICED',
  event_date: new Date('2024-06-15'),
  source_ref: 'svc-001',
};

describe('duplicateResolver', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('isDuplicateEvent', () => {
    it('returns false when no matching event exists', async () => {
      (mockPrisma.vehicleEvent.findFirst as MockInstance).mockResolvedValue(null);
      const result = await isDuplicateEvent(baseCandidate);
      expect(result).toBe(false);
    });

    it('returns true when matching event exists within 30-day window', async () => {
      (mockPrisma.vehicleEvent.findFirst as MockInstance).mockResolvedValue({ id: 'existing-event' });
      const result = await isDuplicateEvent(baseCandidate);
      expect(result).toBe(true);
    });

    it('queries with correct date window (±30 days)', async () => {
      (mockPrisma.vehicleEvent.findFirst as MockInstance).mockResolvedValue(null);
      await isDuplicateEvent(baseCandidate);

      const call = (mockPrisma.vehicleEvent.findFirst as MockInstance).mock.calls[0][0];
      const { gte, lte } = call.where.eventDate;

      const diffStart = baseCandidate.event_date.getTime() - gte.getTime();
      const diffEnd = lte.getTime() - baseCandidate.event_date.getTime();

      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      expect(Math.abs(diffStart - thirtyDaysMs)).toBeLessThan(1000);
      expect(Math.abs(diffEnd - thirtyDaysMs)).toBeLessThan(1000);
    });

    it('includes source_ref in query when provided', async () => {
      (mockPrisma.vehicleEvent.findFirst as MockInstance).mockResolvedValue(null);
      await isDuplicateEvent(baseCandidate);

      const call = (mockPrisma.vehicleEvent.findFirst as MockInstance).mock.calls[0][0];
      expect(call.where.sourceRef).toBe('svc-001');
    });

    it('omits source_ref from query when null', async () => {
      (mockPrisma.vehicleEvent.findFirst as MockInstance).mockResolvedValue(null);
      await isDuplicateEvent({ ...baseCandidate, source_ref: null });

      const call = (mockPrisma.vehicleEvent.findFirst as MockInstance).mock.calls[0][0];
      expect(call.where.sourceRef).toBeUndefined();
    });

    it('new events more than 30 days apart are not duplicates', async () => {
      // findFirst returns null = no match in window = not duplicate
      (mockPrisma.vehicleEvent.findFirst as MockInstance).mockResolvedValue(null);

      const result = await isDuplicateEvent({
        vin: 'JTDBR32E540012345',
        event_type: 'SERVICED',
        event_date: new Date('2024-01-01'),
        source_ref: 'svc-001',
      });

      expect(result).toBe(false);
    });
  });

  describe('filterDuplicateEvents', () => {
    it('filters out duplicate events, keeps new ones', async () => {
      const candidates = [
        { ...baseCandidate, source_ref: 'svc-001' },
        { ...baseCandidate, source_ref: 'svc-002', event_type: 'LISTED_FOR_SALE' },
        { ...baseCandidate, source_ref: 'svc-003' },
      ];

      // First is duplicate, second and third are not
      (mockPrisma.vehicleEvent.findFirst as MockInstance)
        .mockResolvedValueOnce({ id: 'existing' })  // svc-001 = dupe
        .mockResolvedValueOnce(null)                  // svc-002 = new
        .mockResolvedValueOnce(null);                 // svc-003 = new

      const result = await filterDuplicateEvents(candidates);
      expect(result).toHaveLength(2);
      expect(result[0].source_ref).toBe('svc-002');
      expect(result[1].source_ref).toBe('svc-003');
    });

    it('returns empty array when all are duplicates', async () => {
      (mockPrisma.vehicleEvent.findFirst as MockInstance).mockResolvedValue({ id: 'existing' });
      const result = await filterDuplicateEvents([baseCandidate, baseCandidate]);
      expect(result).toHaveLength(0);
    });

    it('returns all when none are duplicates', async () => {
      (mockPrisma.vehicleEvent.findFirst as MockInstance).mockResolvedValue(null);
      const candidates = [
        { ...baseCandidate, source_ref: 'a' },
        { ...baseCandidate, source_ref: 'b' },
      ];
      const result = await filterDuplicateEvents(candidates);
      expect(result).toHaveLength(2);
    });
  });
});
