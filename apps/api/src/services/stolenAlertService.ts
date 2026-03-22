// apps/api/src/services/stolenAlertService.ts
//
// Called on EVERY search — shown FREE, no credits needed.
// Returns active (approved) stolen reports for a plate or VIN.

import prisma from '../lib/prisma.js';
import type { StolenAlertResult, StolenReportRecord } from '../types/stolen_report.types.js';

/**
 * Check if a plate has any active stolen reports.
 * This is the hot path — called on every search, must be fast.
 */
export async function checkPlate(plate: string): Promise<StolenAlertResult> {
  const normalised = normalisePlate(plate);

  const reports = await prisma.stolen_reports.findMany({
    where: {
      plate: normalised,
      status: 'active',
    },
    orderBy: { created_at: 'desc' },
  });

  return {
    hasActiveReport: reports.length > 0,
    reports: reports.map(mapReport),
  };
}

/**
 * Check if a VIN has any active stolen reports.
 */
export async function checkVin(vin: string): Promise<StolenAlertResult> {
  const reports = await prisma.stolen_reports.findMany({
    where: {
      vin,
      status: 'active',
    },
    orderBy: { created_at: 'desc' },
  });

  return {
    hasActiveReport: reports.length > 0,
    reports: reports.map(mapReport),
  };
}

/**
 * Combined check by plate AND vin — union, deduped by id.
 * Used in report generation to catch all possible matches.
 */
export async function checkVehicle(params: {
  plate?: string;
  vin?: string;
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

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = reports.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  return {
    hasActiveReport: unique.length > 0,
    reports: unique.map(mapReport),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalisePlate(plate: string): string {
  return plate.toUpperCase().replace(/\s+/g, '');
}

function mapReport(row: Record<string, unknown>): StolenReportRecord {
  return {
    id: row['id'] as string,
    plate: row['plate'] as string,
    plateDisplay: (row['plate_display'] as string | null) ?? null,
    vin: (row['vin'] as string | null) ?? null,
    reporterUserId: (row['reporter_user_id'] as string | null) ?? null,
    reporterType: row['reporter_type'] as 'owner' | 'family' | 'witness' | 'police',
    dateStolenIso: row['date_stolen'] as string,
    countyStolen: row['county_stolen'] as string,
    townStolen: row['town_stolen'] as string,
    policeObNumber: (row['police_ob_number'] as string | null) ?? null,
    policeStation: (row['police_station'] as string | null) ?? null,
    carColor: row['car_color'] as string,
    identifyingMarks: (row['identifying_marks'] as string | null) ?? null,
    photoUrls: (row['photo_urls'] as string[]) ?? [],
    contactPhone: (row['contact_phone'] as string | null) ?? null,
    contactEmail: (row['contact_email'] as string | null) ?? null,
    status: row['status'] as 'pending' | 'active' | 'recovered' | 'rejected' | 'duplicate',
    isObVerified: Boolean(row['is_ob_verified']),
    adminNote: (row['admin_note'] as string | null) ?? null,
    reviewedBy: (row['reviewed_by'] as string | null) ?? null,
    reviewedAt: row['reviewed_at'] ? new Date(row['reviewed_at'] as string) : null,
    recoveryDate: (row['recovery_date'] as string | null) ?? null,
    recoveryCounty: (row['recovery_county'] as string | null) ?? null,
    recoveryNotes: (row['recovery_notes'] as string | null) ?? null,
    createdAt: new Date(row['created_at'] as string),
  };
}
