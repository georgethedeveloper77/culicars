// apps/api/src/services/stolenAlertService.ts
import prisma from '../lib/prisma';
import type { StolenAlertResult, StolenReportRecord } from '../types/stolen_report.types';

export async function checkPlate(plate: string): Promise<StolenAlertResult> {
  const normalised = normalisePlate(plate);
  const reports = await prisma.stolenReport.findMany({
    where: { plate: normalised, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
  return { hasActiveReport: reports.length > 0, reports: reports.map(mapReport) };
}

export async function checkVin(vin: string): Promise<StolenAlertResult> {
  const reports = await prisma.stolenReport.findMany({
    where: { vin, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
  return { hasActiveReport: reports.length > 0, reports: reports.map(mapReport) };
}

export async function checkVehicle(params: {
  plate?: string | null;
  vin?: string | null;
}): Promise<StolenAlertResult> {
  if (!params.plate && !params.vin) {
    return { hasActiveReport: false, reports: [] };
  }

  const conditions: object[] = [];
  if (params.plate) conditions.push({ plate: normalisePlate(params.plate), status: 'active' });
  if (params.vin) conditions.push({ vin: params.vin, status: 'active' });

  const reports = await prisma.stolenReport.findMany({
    where: { OR: conditions },
    orderBy: { createdAt: 'desc' },
  });

  const seen = new Set<string>();
  const unique = reports.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  return { hasActiveReport: unique.length > 0, reports: unique.map(mapReport) };
}

function normalisePlate(plate: string): string {
  return plate.toUpperCase().replace(/\s+/g, '');
}

function mapReport(row: Record<string, unknown>): StolenReportRecord {
  return {
    id: row['id'] as string,
    plate: row['plate'] as string,
    plateDisplay: (row['plateDisplay'] as string | null) ?? null,
    vin: (row['vin'] as string | null) ?? null,
    reporterUserId: (row['reporterUserId'] as string | null) ?? null,
    reporterType: row['reporterType'] as 'owner' | 'family' | 'witness' | 'police',
    dateStolenIso: row['dateStolen'] as string,
    countyStolen: row['countyStolen'] as string,
    townStolen: row['townStolen'] as string,
    policeObNumber: (row['policeObNumber'] as string | null) ?? null,
    policeStation: (row['policeStation'] as string | null) ?? null,
    carColor: row['carColor'] as string,
    identifyingMarks: (row['identifyingMarks'] as string | null) ?? null,
    photoUrls: (row['photoUrls'] as string[]) ?? [],
    contactPhone: (row['contactPhone'] as string | null) ?? null,
    contactEmail: (row['contactEmail'] as string | null) ?? null,
    status: row['status'] as 'pending' | 'active' | 'recovered' | 'rejected' | 'duplicate',
    isObVerified: Boolean(row['isObVerified']),
    adminNote: (row['adminNote'] as string | null) ?? null,
    reviewedBy: (row['reviewedBy'] as string | null) ?? null,
    reviewedAt: row['reviewedAt'] ? new Date(row['reviewedAt'] as string) : null,
    recoveryDate: (row['recoveryDate'] as string | null) ?? null,
    recoveryCounty: (row['recoveryCounty'] as string | null) ?? null,
    recoveryNotes: (row['recoveryNotes'] as string | null) ?? null,
    createdAt: new Date(row['createdAt'] as string),
  };
}
