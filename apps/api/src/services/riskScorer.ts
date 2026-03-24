// ============================================================
// CuliCars — Thread 5: Risk Scorer
// Queries DB for risk factors, delegates scoring to riskCalculator
// ============================================================

import prisma from '../lib/prisma';
import { calculateRisk, type RiskInput, type RiskResult } from '@culicars/utils/riskCalculator';

/**
 * Gather all risk factors for a VIN from the database
 * and compute the risk score.
 */
export async function scoreRisk(vin: string): Promise<RiskResult> {
  // Parallel queries for all risk factors
  const [
    vehicle,
    stolenReports,
    damageEvents,
    mileageEvents,
    ownershipEvents,
    purposeEvents,
  ] = await Promise.all([
    prisma.vehicle.findUnique({
      where: { vin },
      select: {
        inspectionStatus: true,
        caveatStatus: true,
        psvLicensed: true,
        japanAuctionGrade: true,
        ntsaCorVerified: true,
      },
    }),

    // Active stolen reports
    prisma.stolenReport.count({
      where: { vin, status: 'active' },
    }),

    // Damage events (check for severe)
    prisma.vehicleEvent.findMany({
      where: {
        vin,
        eventType: { in: ['DAMAGED', 'REPAIRED'] },
      },
      select: { metadata: true },
    }),

    // Mileage-related events for rollback check
    prisma.vehicleEvent.findMany({
      where: {
        vin,
        eventType: { in: ['SERVICED', 'INSPECTED', 'LISTED_FOR_SALE', 'AUCTIONED'] },
      },
      select: { eventDate: true, metadata: true },
      orderBy: { eventDate: 'asc' },
    }),

    // Ownership changes
    prisma.vehicleEvent.count({
      where: { vin, eventType: 'OWNERSHIP_CHANGE' },
    }),

    // PSV/taxi events
    prisma.vehicleEvent.count({
      where: { vin, eventType: 'PSV_LICENSED' },
    }),
  ]);

  // Check for severe damage in metadata
  const hasSevereDamage = damageEvents.some((e) => {
    const meta = e.metadata as Record<string, unknown> | null;
    return meta?.severity === 'severe' || meta?.structural === true;
  });

  // Check for mileage rollback
  const mileageReadings = mileageEvents
    .map((e) => {
      const meta = e.metadata as Record<string, unknown> | null;
      const mileage = meta?.mileage as number | undefined;
      return mileage
        ? { date: e.eventDate.toISOString(), mileage, source: 'event' }
        : null;
    })
    .filter((r): r is { date: string; mileage: number; source: string } => r !== null);

  let hasMileageRollback = false;
  if (mileageReadings.length >= 2) {
    let maxSoFar = 0;
    for (const r of mileageReadings) {
      if (r.mileage < maxSoFar - 500) {
        hasMileageRollback = true;
        break;
      }
      if (r.mileage > maxSoFar) maxSoFar = r.mileage;
    }
  }

  // Has finance caveat?
  const hasFinanceCaveat =
    vehicle?.caveatStatus === 'caveat';

  // Failed/expired inspection?
  const hasFailedInspection =
    vehicle?.inspectionStatus === 'failed' ||
    vehicle?.inspectionStatus === 'expired';

  // PSV/matatu history
  const hasPsvHistory =
    (vehicle?.psvLicensed ?? false) || purposeEvents > 0;

  // Has NTSA data?
  const hasNtsaData = vehicle?.ntsaCorVerified ?? false;

  const input: RiskInput = {
    hasStolenReport: stolenReports > 0,
    hasSevereDamage,
    hasMileageRollback,
    hasFinanceCaveat,
    hasFailedInspection,
    hasPsvHistory,
    ownershipChanges: ownershipEvents,
    japanAuctionGrade: vehicle?.japanAuctionGrade ?? null,
    hasNtsaData,
  };

  return calculateRisk(input);
}
