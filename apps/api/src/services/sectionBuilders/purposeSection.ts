// ============================================================
// CuliCars — Section Builder: PURPOSE (LOCKED)
// Was this vehicle used commercially? PSV/Taxi/Rental/etc.
// ============================================================

import prisma from '../../lib/prisma';
import type { PurposeSectionData, PurposeCheckCard } from '../../types/report.types';

const PURPOSE_CHECKS = [
  { type: 'PSV',            label: 'PSV / Matatu',          eventType: 'PSV_LICENSED' },
  { type: 'Taxi',           label: 'Taxi / Uber / Bolt',    eventType: null },
  { type: 'Rental',         label: 'Rental / Hire Car',     eventType: null },
  { type: 'Transport',      label: 'Transport / Lorry',     eventType: null },
  { type: 'Police',         label: 'Police / Government',   eventType: null },
  { type: 'DrivingSchool',  label: 'Driving School',        eventType: null },
  { type: 'Ambulance',      label: 'Ambulance / Medical',   eventType: null },
] as const;

export async function buildPurposeSection(vin: string): Promise<{
  data: PurposeSectionData;
  recordCount: number;
  dataStatus: 'found' | 'not_found' | 'not_checked';
}> {
  const [vehicle, psvEvents, allEvents] = await Promise.all([
    prisma.vehicle.findUnique({
      where: { vin },
      select: { psvLicensed: true },
    }),

    // PSV license events
    prisma.vehicleEvent.findMany({
      where: { vin, eventType: 'PSV_LICENSED' },
      select: { eventDate: true, source: true, metadata: true },
    }),

    // All events — check metadata for commercial use indicators
    prisma.vehicleEvent.findMany({
      where: { vin },
      select: { eventType: true, metadata: true, source: true },
    }),
  ]);

  const checks: PurposeCheckCard[] = PURPOSE_CHECKS.map((check) => {
    let found = false;
    let source: string | undefined;
    let details: string | undefined;

    if (check.type === 'PSV') {
      found = (vehicle?.psvLicensed ?? false) || psvEvents.length > 0;
      if (psvEvents.length > 0) {
        source = psvEvents[0].source ?? undefined;
        details = `PSV licensed — ${psvEvents.length} record(s) found`;
      }
    } else {
      // Check event metadata for commercial use indicators
      const commercialEvent = allEvents.find((e) => {
        const meta = e.metadata as Record<string, unknown> | null;
        return meta?.commercialUse === check.type ||
               meta?.vehicleUse === check.type?.toLowerCase();
      });
      if (commercialEvent) {
        found = true;
        source = commercialEvent.source ?? undefined;
        details = `Record found in ${source}`;
      }
    }

    return {
      type: check.type,
      label: check.label,
      found,
      source,
      details,
    };
  });

  const hasCommercialHistory = checks.some((c) => c.found);
  const recordCount = checks.filter((c) => c.found).length;

  return {
    data: { checks, hasCommercialHistory },
    recordCount,
    dataStatus: recordCount > 0 ? 'found' : 'not_found',
  };
}
