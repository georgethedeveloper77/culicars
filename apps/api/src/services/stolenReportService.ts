// apps/api/src/services/stolenReportService.ts

import prisma from '../lib/prisma.js';
import type {
  StolenReportSubmission,
  StolenReportReview,
  RecoverySubmission,
  StolenReportRecord,
  StolenStatus,
} from '../types/stolen_report.types.js';

// ---------------------------------------------------------------------------
// Submit (public — no auth required)
// ---------------------------------------------------------------------------

export async function submitReport(
  submission: StolenReportSubmission,
  userId: string | null,
): Promise<StolenReportRecord> {
  const plate = normalisePlate(submission.plate);
  const plateDisplay = formatPlateDisplay(plate);

  // Check for recent duplicate (same plate, submitted in last 24h, still pending/active)
  const recentDuplicate = await prisma.stolen_reports.findFirst({
    where: {
      plate,
      status: { in: ['pending', 'active'] },
      created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  if (recentDuplicate) {
    throw Object.assign(
      new Error('A report for this vehicle was recently submitted and is under review'),
      { status: 409 },
    );
  }

  const record = await prisma.stolen_reports.create({
    data: {
      plate,
      plate_display: plateDisplay,
      vin: submission.vin ?? null,
      reporter_user_id: userId,
      reporter_type: submission.reporterType,
      date_stolen: new Date(submission.dateStolenIso),
      county_stolen: submission.countyStolen,
      town_stolen: submission.townStolen,
      police_ob_number: submission.policeObNumber ?? null,
      police_station: submission.policeStation ?? null,
      car_color: submission.carColor,
      identifying_marks: submission.identifyingMarks ?? null,
      photo_urls: submission.photoUrls ?? [],
      contact_phone: submission.contactPhone ?? null,
      contact_email: submission.contactEmail ?? null,
      status: 'pending',
      is_ob_verified: false,
    },
  });

  return mapReport(record);
}

// ---------------------------------------------------------------------------
// Get by plate (public — FREE)
// ---------------------------------------------------------------------------

export async function getByPlate(plate: string): Promise<StolenReportRecord[]> {
  const rows = await prisma.stolen_reports.findMany({
    where: { plate: normalisePlate(plate) },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapReport);
}

// ---------------------------------------------------------------------------
// Get by VIN (public — FREE)
// ---------------------------------------------------------------------------

export async function getByVin(vin: string): Promise<StolenReportRecord[]> {
  const rows = await prisma.stolen_reports.findMany({
    where: { vin },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapReport);
}

// ---------------------------------------------------------------------------
// Get single
// ---------------------------------------------------------------------------

export async function getById(id: string): Promise<StolenReportRecord | null> {
  const row = await prisma.stolen_reports.findUnique({ where: { id } });
  return row ? mapReport(row) : null;
}

// ---------------------------------------------------------------------------
// Admin review
// ---------------------------------------------------------------------------

export async function reviewReport(
  id: string,
  review: StolenReportReview,
  adminUserId: string,
): Promise<StolenReportRecord> {
  const existing = await prisma.stolen_reports.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error('Report not found'), { status: 404 });
  }

  const updated = await prisma.stolen_reports.update({
    where: { id },
    data: {
      status: review.status,
      admin_note: review.adminNote ?? null,
      is_ob_verified: review.isObVerified ?? false,
      reviewed_by: adminUserId,
      reviewed_at: new Date(),
    },
  });

  if (review.status === 'active') {
    await handleApproval(updated);
  }

  return mapReport(updated);
}

// ---------------------------------------------------------------------------
// Mark recovered (owner self-service)
// ---------------------------------------------------------------------------

export async function markRecovered(
  id: string,
  recovery: RecoverySubmission,
  userId: string | null,
): Promise<StolenReportRecord> {
  const existing = await prisma.stolen_reports.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error('Report not found'), { status: 404 });
  }
  if (existing.status !== 'active') {
    throw Object.assign(new Error('Only active reports can be marked as recovered'), {
      status: 400,
    });
  }

  // Only the original reporter or an admin can mark recovered
  if (userId && existing.reporter_user_id && existing.reporter_user_id !== userId) {
    throw Object.assign(new Error('Unauthorized'), { status: 403 });
  }

  const updated = await prisma.stolen_reports.update({
    where: { id },
    data: {
      status: 'recovered',
      recovery_date: new Date(recovery.recoveryDate),
      recovery_county: recovery.recoveryCounty,
      recovery_notes: recovery.recoveryNotes ?? null,
    },
  });

  // Add RECOVERED event to vehicle timeline
  if (updated.vin) {
    await prisma.vehicle_events.create({
      data: {
        vin: updated.vin,
        event_type: 'RECOVERED',
        event_date: new Date(recovery.recoveryDate),
        county: recovery.recoveryCounty,
        source: 'community_stolen_report',
        source_ref: id,
        confidence: 0.7,
        metadata: {
          stolenReportId: id,
          recoveryNotes: recovery.recoveryNotes,
        },
      },
    });

    // Mark reports stale so theft section regenerates
    await prisma.reports.updateMany({
      where: { vin: updated.vin },
      data: { status: 'stale' },
    });
  }

  return mapReport(updated);
}

// ---------------------------------------------------------------------------
// Approval side-effects
// ---------------------------------------------------------------------------

async function handleApproval(report: Record<string, unknown>): Promise<void> {
  const vin = report['vin'] as string | null;
  const plate = report['plate'] as string;
  const dateStolenRaw = report['date_stolen'];
  const dateStolenDate =
    dateStolenRaw instanceof Date ? dateStolenRaw : new Date(dateStolenRaw as string);
  const county = report['county_stolen'] as string;
  const stolenReportId = report['id'] as string;

  let resolvedVin = vin;

  // If no VIN provided, try to resolve from plate_vin_map
  if (!resolvedVin) {
    const mapping = await prisma.plate_vin_map.findFirst({
      where: { plate },
      orderBy: { confidence: 'desc' },
    });
    resolvedVin = mapping?.vin ?? null;
  }

  if (resolvedVin) {
    // Ensure vehicle exists — it may have been added by other sources
    const vehicle = await prisma.vehicles.findUnique({ where: { vin: resolvedVin } });

    if (!vehicle) {
      // Create minimal vehicle record from stolen report data
      await prisma.vehicles.create({
        data: {
          vin: resolvedVin,
          color: report['car_color'] as string,
        },
      });

      // Create plate-VIN mapping if VIN was user-provided
      if (vin) {
        await prisma.plate_vin_map.upsert({
          where: { id: `${plate}-${resolvedVin}` },
          create: {
            plate,
            plate_display: formatPlateDisplay(plate),
            vin: resolvedVin,
            confidence: 0.4,
            source: 'contribution',
          },
          update: {},
        });
      }
    }

    // Insert STOLEN vehicle event
    await prisma.vehicle_events.create({
      data: {
        vin: resolvedVin,
        event_type: 'STOLEN',
        event_date: dateStolenDate,
        county,
        source: 'community_stolen_report',
        source_ref: stolenReportId,
        confidence: 0.8,
        metadata: {
          stolenReportId,
          policeObNumber: report['police_ob_number'],
          isObVerified: report['is_ob_verified'],
          carColor: report['car_color'],
        },
      },
    });

    // Mark all existing reports stale → risk score recalculates to CRITICAL
    await prisma.reports.updateMany({
      where: { vin: resolvedVin },
      data: { status: 'stale' },
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalisePlate(plate: string): string {
  return plate.toUpperCase().replace(/\s+/g, '');
}

function formatPlateDisplay(normalised: string): string {
  // KCA123A → KCA 123A (standard post-2004 format)
  const match = normalised.match(/^([A-Z]{3})(\d{3})([A-Z])$/);
  if (match) return `${match[1]} ${match[2]}${match[3]}`;

  // KCA123 → KCA 123 (older private)
  const old = normalised.match(/^([A-Z]{3})(\d{3})$/);
  if (old) return `${old[1]} ${old[2]}`;

  return normalised;
}

function mapReport(row: Record<string, unknown>): StolenReportRecord {
  return {
    id: row['id'] as string,
    plate: row['plate'] as string,
    plateDisplay: (row['plate_display'] as string | null) ?? null,
    vin: (row['vin'] as string | null) ?? null,
    reporterUserId: (row['reporter_user_id'] as string | null) ?? null,
    reporterType: row['reporter_type'] as 'owner' | 'family' | 'witness' | 'police',
    dateStolenIso:
      row['date_stolen'] instanceof Date
        ? row['date_stolen'].toISOString().split('T')[0]
        : (row['date_stolen'] as string),
    countyStolen: row['county_stolen'] as string,
    townStolen: row['town_stolen'] as string,
    policeObNumber: (row['police_ob_number'] as string | null) ?? null,
    policeStation: (row['police_station'] as string | null) ?? null,
    carColor: row['car_color'] as string,
    identifyingMarks: (row['identifying_marks'] as string | null) ?? null,
    photoUrls: (row['photo_urls'] as string[]) ?? [],
    contactPhone: (row['contact_phone'] as string | null) ?? null,
    contactEmail: (row['contact_email'] as string | null) ?? null,
    status: row['status'] as StolenStatus,
    isObVerified: Boolean(row['is_ob_verified']),
    adminNote: (row['admin_note'] as string | null) ?? null,
    reviewedBy: (row['reviewed_by'] as string | null) ?? null,
    reviewedAt: row['reviewed_at'] ? new Date(row['reviewed_at'] as string) : null,
    recoveryDate:
      row['recovery_date'] instanceof Date
        ? (row['recovery_date'] as Date).toISOString().split('T')[0]
        : ((row['recovery_date'] as string | null) ?? null),
    recoveryCounty: (row['recovery_county'] as string | null) ?? null,
    recoveryNotes: (row['recovery_notes'] as string | null) ?? null,
    createdAt: new Date(row['created_at'] as string),
  };
}
