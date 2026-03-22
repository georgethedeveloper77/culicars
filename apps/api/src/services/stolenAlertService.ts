// apps/api/src/services/stolenAlertService.ts
// Checked on EVERY search — shown FREE, no credits needed
// This is a public safety feature

import prisma from '../lib/prisma';
import type { StolenAlert, StolenAlertReport } from '../types/search.types';

const EMPTY_ALERT: StolenAlert = { active: false, reportCount: 0, reports: [] };

export async function checkStolenByPlate(normalizedPlate: string): Promise<StolenAlert> {
  if (!normalizedPlate) return EMPTY_ALERT;

  const reports = await prisma.stolenReport.findMany({
    where: { plate: normalizedPlate, status: { in: ['active', 'recovered', 'pending'] } },
    orderBy: { createdAt: 'desc' },
  });

  return buildAlert(reports);
}

export async function checkStolenByVin(vin: string): Promise<StolenAlert> {
  if (!vin) return EMPTY_ALERT;

  const reports = await prisma.stolenReport.findMany({
    where: { vin, status: { in: ['active', 'recovered', 'pending'] } },
    orderBy: { createdAt: 'desc' },
  });

  return buildAlert(reports);
}

export async function checkStolen(
  normalizedPlate: string | null,
  vin: string | null
): Promise<StolenAlert> {
  if (!normalizedPlate && !vin) return EMPTY_ALERT;

  const conditions = [];
  if (normalizedPlate) conditions.push({ plate: normalizedPlate });
  if (vin) conditions.push({ vin });

  const reports = await prisma.stolenReport.findMany({
    where: { OR: conditions, status: { in: ['active', 'recovered', 'pending'] } },
    orderBy: { createdAt: 'desc' },
  });

  // Deduplicate by ID
  const unique = [...new Map(reports.map((r) => [r.id, r])).values()];
  return buildAlert(unique);
}

function buildAlert(reports: any[]): StolenAlert {
  if (reports.length === 0) return EMPTY_ALERT;

  const hasActive = reports.some((r) => r.status === 'active');

  const alertReports: StolenAlertReport[] = reports.map((r) => ({
    id: r.id,
    plate: r.plate,
    plateDisplay: r.plateDisplay,
    dateStolen: r.dateStolen.toISOString().split('T')[0],
    countyStolen: r.countyStolen,
    policeObNumber: r.policeObNumber,
    isObVerified: r.isObVerified,
    carColor: r.carColor,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return { active: hasActive, reportCount: reports.length, reports: alertReports };
}
