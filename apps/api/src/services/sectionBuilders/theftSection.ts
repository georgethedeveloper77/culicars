// ============================================================
// CuliCars — Section Builder: THEFT (LOCKED)
// Police databases + community stolen reports
// ============================================================

import prisma from '../../lib/prisma';
import type { TheftSectionData, TheftCheckCard } from '../../types/report.types';

export async function buildTheftSection(vin: string): Promise<{
  data: TheftSectionData;
  recordCount: number;
  dataStatus: 'found' | 'not_found' | 'not_checked';
}> {
  const [stolenReports, theftEvents, recoveryEvents] = await Promise.all([
    // Community stolen reports
    prisma.stolenReport.findMany({
      where: { vin },
      select: {
        dateStolen: true,
        countyStolen: true,
        policeObNumber: true,
        status: true,
        isObVerified: true,
      },
      orderBy: { dateStolen: 'desc' },
    }),

    // Stolen events
    prisma.vehicleEvent.findMany({
      where: { vin, eventType: { in: ['STOLEN', 'WANTED'] } },
      select: { eventDate: true, source: true, metadata: true },
    }),

    // Recovery events
    prisma.vehicleEvent.findMany({
      where: { vin, eventType: 'RECOVERED' },
      select: { eventDate: true, source: true },
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
    dateStolen: r.dateStolen.toISOString().split('T')[0],
    county: r.countyStolen,
    obNumber: r.policeObNumber,
    status: r.status ?? 'pending',
    isObVerified: r.isObVerified ?? false,
  }));

  const recordCount = stolenReports.length + theftEvents.length;

  return {
    data: {
      currentlyWanted,
      stolenInPast,
      recovered,
      checks,
      communityReports,
    },
    recordCount,
    dataStatus: recordCount > 0 ? 'found' : 'not_found',
  };
}
