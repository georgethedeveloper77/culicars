// ============================================================
// CuliCars — Section Builder: THEFT (LOCKED)
// Police databases + community stolen reports
// ============================================================

import { prisma } from '../../lib/prisma';
import type { TheftSectionData, TheftCheckCard } from '../../types/report.types';

export async function buildTheftSection(vin: string): Promise<{
  data: TheftSectionData;
  record_count: number;
  data_status: 'found' | 'not_found' | 'not_checked';
}> {
  const [stolenReports, theftEvents, recoveryEvents] = await Promise.all([
    // Community stolen reports
    prisma.stolen_reports.findMany({
      where: { vin },
      select: {
        date_stolen: true,
        county_stolen: true,
        police_ob_number: true,
        status: true,
        is_ob_verified: true,
      },
      orderBy: { date_stolen: 'desc' },
    }),

    // Stolen events
    prisma.vehicle_events.findMany({
      where: { vin, event_type: { in: ['STOLEN', 'WANTED'] } },
      select: { event_date: true, source: true, metadata: true },
    }),

    // Recovery events
    prisma.vehicle_events.findMany({
      where: { vin, event_type: 'RECOVERED' },
      select: { event_date: true, source: true },
    }),
  ]);

  const activeReports = stolenReports.filter((r) => r.status === 'active');
  const recoveredReports = stolenReports.filter((r) => r.status === 'recovered');

  const currentlyWanted = activeReports.length > 0 || theftEvents.length > 0;
  const stolenInPast = stolenReports.length > 0 || theftEvents.length > 0;
  const recovered = recoveredReports.length > 0 || recoveryEvents.length > 0;

  // Build database check cards
  const checks: TheftCheckCard[] = [
    {
      database: 'CuliCars Community',
      checked: true,
      found: stolenReports.length > 0,
      details: stolenReports.length > 0
        ? `${stolenReports.length} report(s) found`
        : 'No community reports',
    },
    {
      database: 'Kenya Police',
      checked: false,  // Future partnership
      found: false,
      details: 'Partnership pending — not yet checked',
    },
    {
      database: 'Interpol',
      checked: false,  // Future partnership
      found: false,
      details: 'Partnership pending — not yet checked',
    },
  ];

  const communityReports = stolenReports.map((r) => ({
    date_stolen: r.date_stolen.toISOString().split('T')[0],
    county: r.county_stolen,
    obNumber: r.police_ob_number,
    status: r.status ?? 'pending',
    is_ob_verified: r.is_ob_verified ?? false,
  }));

  const record_count = stolenReports.length + theftEvents.length;

  return {
    data: {
      currentlyWanted,
      stolenInPast,
      recovered,
      checks,
      communityReports,
    },
    record_count,
    data_status: record_count > 0 ? 'found' : 'not_found',
  };
}
