// ============================================================
// CuliCars — Section Builder: SERVICE (LOCKED)
// Service records from Auto Express, Peach Cars, contributions
// ============================================================

import prisma from '../../lib/prisma';
import type { ServiceSectionData, ServiceEntry } from '../../types/report.types';

export async function buildServiceSection(vin: string): Promise<{
  data: ServiceSectionData;
  recordCount: number;
  dataStatus: 'found' | 'not_found' | 'not_checked';
}> {
  const serviceEvents = await prisma.vehicleEvents.findMany({
    where: {
      vin,
      eventType: 'SERVICED',
    },
    select: {
      eventDate: true,
      county: true,
      source: true,
      metadata: true,
    },
    orderBy: { eventDate: 'desc' },
  });

  const entries: ServiceEntry[] = serviceEvents.map((event) => {
    const meta = event.metadata as Record<string, unknown> | null;

    return {
      date: event.eventDate.toISOString().split('T')[0],
      garageName: (meta?.garageName as string) || 'Unknown garage',
      county: event.county ?? undefined,
      mileage: (meta?.mileage as number) || undefined,
      workDone: (meta?.workDone as string) || (meta?.description as string) || 'Service performed',
      workTypes: Array.isArray(meta?.workTypes)
        ? (meta.workTypes as string[])
        : [],
      source: event.source ?? 'unknown',
    };
  });

  // Service records with mileage help verify odometer
  const mileageVerification = entries.some((e) => e.mileage && e.mileage > 0);

  return {
    data: {
      entries,
      totalServices: entries.length,
      lastServiceDate: entries.length > 0 ? entries[0].date : null,
      mileageVerification,
    },
    recordCount: entries.length,
    dataStatus: entries.length > 0 ? 'found' : 'not_found',
  };
}
