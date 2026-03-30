// ============================================================
// CuliCars — Section Builder: OWNERSHIP (LOCKED)
// Transfer count + ownership history
// ============================================================

import { prisma } from '../../lib/prisma';
import type { OwnershipSectionData } from '../../types/report.types';

export async function buildOwnershipSection(vin: string): Promise<{
  data: OwnershipSectionData;
  record_count: number;
  data_status: 'found' | 'not_found' | 'not_checked';
}> {
  const ownershipEvents = await prisma.vehicle_events.findMany({
    where: {
      vin,
      event_type: 'OWNERSHIP_CHANGE',
    },
    select: {
      event_date: true,
      county: true,
      source: true,
    },
    orderBy: { event_date: 'asc' },
  });

  const transfers = ownershipEvents.map((e) => ({
    date: e.event_date.toISOString().split('T')[0],
    county: e.county ?? undefined,
    source: e.source ?? 'unknown',
  }));

  const transferCount = transfers.length;
  const highTurnover = transferCount >= 4;

  return {
    data: {
      transferCount,
      transfers,
      highTurnover,
    },
    record_count: transferCount,
    data_status: transferCount > 0 ? 'found' : 'not_found',
  };
}
