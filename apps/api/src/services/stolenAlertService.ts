// apps/api/src/services/stolenAlertService.ts
import prisma from '../lib/prisma';
import type { StolenAlertResult, StolenReportRecord } from '../types/stolen_report.types';

export async function checkPlate(plate: string): Promise<StolenAlertResult> {
  const normalised = normalisePlate(plate);
  const reports = await prisma.stolen_reports.findMany({
    where: { plate: normalised, status: 'active' },
    orderBy: { created_at: 'desc' },
  });
  return { hasActiveReport: reports.length > 0, reports: reports.map(mapReport) };
}

export async function checkVin(vin: string): Promise<StolenAlertResult> {
  const reports = await prisma.stolen_reports.findMany({
    where: { vin, status: 'active' },
    orderBy: { created_at: 'desc' },
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

  const reports = await prisma.stolen_reports.findMany({
    where: { OR: conditions },
    orderBy: { created_at: 'desc' },
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
    plate_display: (row['plateDisplay'] as string | null) ?? null,
    vin: (row['vin'] as string | null) ?? null,
    reporter_user_id: (row['reporterUserId'] as string | null) ?? null,
    reporter_type: row['reporterType'] as 'owner' | 'family' | 'witness' | 'police',
    dateStolenIso: row['dateStolen'] as string,
    county_stolen: row['countyStolen'] as string,
    town_stolen: row['townStolen'] as string,
    police_ob_number: (row['policeObNumber'] as string | null) ?? null,
    police_station: (row['policeStation'] as string | null) ?? null,
    car_color: row['carColor'] as string,
    identifyingMarks: (row['identifyingMarks'] as string | null) ?? null,
    photoUrls: (row['photoUrls'] as string[]) ?? [],
    contactPhone: (row['contactPhone'] as string | null) ?? null,
    contactEmail: (row['contactEmail'] as string | null) ?? null,
    status: row['status'] as 'pending' | 'active' | 'recovered' | 'rejected' | 'duplicate',
    is_ob_verified: Boolean(row['isObVerified']),
    admin_note: (row['adminNote'] as string | null) ?? null,
    reviewed_by: (row['reviewedBy'] as string | null) ?? null,
    reviewed_at: row['reviewedAt'] ? new Date(row['reviewedAt'] as string) : null,
    recovery_date: (row['recoveryDate'] as string | null) ?? null,
    recovery_county: (row['recoveryCounty'] as string | null) ?? null,
    recovery_notes: (row['recoveryNotes'] as string | null) ?? null,
    created_at: new Date(row['createdAt'] as string),
  };
}
