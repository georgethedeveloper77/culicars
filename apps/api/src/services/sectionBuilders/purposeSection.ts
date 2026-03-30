// ============================================================
// CuliCars — Section Builder: PURPOSE (LOCKED)
// Was this vehicle used commercially? PSV/Taxi/Rental/etc.
// ============================================================

import prisma from '../../lib/prisma';
import type { PurposeSectionData, PurposeCheckCard } from '../../types/report.types';

const PURPOSE_CHECKS = [
  { type: 'PSV',            label: 'PSV / Matatu',          event_type: 'PSV_LICENSED' },
  { type: 'Taxi',           label: 'Taxi / Uber / Bolt',    event_type: null },
  { type: 'Rental',         label: 'Rental / Hire Car',     event_type: null },
  { type: 'Transport',      label: 'Transport / Lorry',     event_type: null },
  { type: 'Police',         label: 'Police / Government',   event_type: null },
  { type: 'DrivingSchool',  label: 'Driving School',        event_type: null },
  { type: 'Ambulance',      label: 'Ambulance / Medical',   event_type: null },
] as const;

export async function buildPurposeSection(vin: string): Promise<{
  data: PurposeSectionData;
  record_count: number;
  data_status: 'found' | 'not_found' | 'not_checked';
}> {
  const [vehicle, psvEvents, allEvents] = await Promise.all([
    prisma.vehicles.findUnique({
      where: { vin },
      select: { psv_licensed: true },
    }),

    // PSV license events
    prisma.vehicle_events.findMany({
      where: { vin, event_type: 'PSV_LICENSED' },
      select: { event_date: true, source: true, metadata: true },
    }),

    // All events — check metadata for commercial use indicators
    prisma.vehicle_events.findMany({
      where: { vin },
      select: { event_type: true, metadata: true, source: true },
    }),
  ]);

  const checks: PurposeCheckCard[] = PURPOSE_CHECKS.map((check) => {
    let found = false;
    let source: string | undefined;
    let details: string | undefined;

    if (check.type === 'PSV') {
      found = (vehicle?.psv_licensed ?? false) || psvEvents.length > 0;
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
    data_status: recordCount > 0 ? 'found' : 'not_found',
  };
}
