// ============================================================
// CuliCars — Section Builder: OWNERSHIP (LOCKED)
// Transfer count + ownership history
// ============================================================

import prisma from '../../lib/prisma';
import type { OwnershipSectionData } from '../../types/report.types';

export async function buildOwnershipSection(vin: string): Promise<{
  data: OwnershipSectionData;
  recordCount: number;
  dataStatus: 'found' | 'not_found' | 'not_checked';
}> {
  const ownershipEvents = await prisma.vehicleEvents.findMany({
    where: {
      vin,
      eventType: 'OWNERSHIP_CHANGE',
    },
    select: {
      eventDate: true,
      county: true,
      source: true,
    },
    orderBy: { eventDate: 'asc' },
  });

  const transfers = ownershipEvents.map((e) => ({
    date: e.eventDate.toISOString().split('T')[0],
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
    recordCount: transferCount,
    dataStatus: transferCount > 0 ? 'found' : 'not_found',
  };
}
