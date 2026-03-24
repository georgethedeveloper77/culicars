// apps/api/src/services/stolenReportService.ts

import prisma from '../lib/prisma';
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
  const recentDuplicate = await prisma.stolenReport.findFirst({
    where: {
      plate,
      status: { in: ['pending', 'active'] },
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });

  if (recentDuplicate) {
    throw Object.assign(
      new Error('A report for this vehicle was recently submitted and is under review'),
      { status: 409 },
    );
  }

  const record = await prisma.stolenReport.create({
    data: {
      plate,
      plateDisplay: plateDisplay,
      vin: submission.vin ?? null,
      reporterUserId: userId,
      reporterType: submission.reporterType,
      dateStolen: new Date(submission.dateStolenIso),
      countyStolen: submission.countyStolen,
      townStolen: submission.townStolen,
      policeObNumber: submission.policeObNumber ?? null,
      policeStation: submission.policeStation ?? null,
      carColor: submission.carColor,
      identifyingMarks: submission.identifyingMarks ?? null,
      photoUrls: submission.photoUrls ?? [],
      contactPhone: submission.contactPhone ?? null,
      contactEmail: submission.contactEmail ?? null,
      status: 'pending',
      isObVerified: false,
    },
  });

  return mapReport(record);
}

// ---------------------------------------------------------------------------
// Get by plate (public — FREE)
// ---------------------------------------------------------------------------

export async function getByPlate(plate: string): Promise<StolenReportRecord[]> {
  const rows = await prisma.stolenReport.findMany({
    where: { plate: normalisePlate(plate) },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapReport);
}

// ---------------------------------------------------------------------------
// Get by VIN (public — FREE)
// ---------------------------------------------------------------------------

export async function getByVin(vin: string): Promise<StolenReportRecord[]> {
  const rows = await prisma.stolenReport.findMany({
    where: { vin },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(mapReport);
}

// ---------------------------------------------------------------------------
// Get single
// ---------------------------------------------------------------------------

export async function getById(id: string): Promise<StolenReportRecord | null> {
  const row = await prisma.stolenReport.findUnique({ where: { id } });
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
  const existing = await prisma.stolenReport.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error('Report not found'), { status: 404 });
  }

  const updated = await prisma.stolenReport.update({
    where: { id },
    data: {
      status: review.status,
      adminNote: review.adminNote ?? null,
      isObVerified: review.isObVerified ?? false,
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
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
  const existing = await prisma.stolenReport.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error('Report not found'), { status: 404 });
  }
  if (existing.status !== 'active') {
    throw Object.assign(new Error('Only active reports can be marked as recovered'), {
      status: 400,
    });
  }

  // Only the original reporter or an admin can mark recovered
  if (userId && existing.reporterUserId && existing.reporterUserId !== userId) {
    throw Object.assign(new Error('Unauthorized'), { status: 403 });
  }

  const updated = await prisma.stolenReport.update({
    where: { id },
    data: {
      status: 'recovered',
      recoveryDate: new Date(recovery.recoveryDate),
      recoveryCounty: recovery.recoveryCounty,
      recoveryNotes: recovery.recoveryNotes ?? null,
    },
  });

  // Add RECOVERED event to vehicle timeline
  if (updated.vin) {
    await prisma.vehicleEvent.create({
      data: {
        vin: updated.vin,
        eventType: 'RECOVERED',
        eventDate: new Date(recovery.recoveryDate),
        county: recovery.recoveryCounty,
        source: 'community_stolen_report',
        sourceRef: id,
        confidence: 0.7,
        metadata: ({
          stolenReportId: id,
          recoveryNotes: recovery.recoveryNotes,
        }) as any,
      },
    });

    // Mark reports stale so theft section regenerates
    await prisma.report.updateMany({
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
  const dateStolenRaw = report['dateStolen'];
  const dateStolenDate =
    dateStolenRaw instanceof Date ? dateStolenRaw : new Date(dateStolenRaw as string);
  const county = report['countyStolen'] as string;
  const stolenReportId = report['id'] as string;

  let resolvedVin = vin;

  // If no VIN provided, try to resolve from plate_vin_map
  if (!resolvedVin) {
    const mapping = await prisma.plateVinMap.findFirst({
      where: { plate },
      orderBy: { confidence: 'desc' },
    });
    resolvedVin = mapping?.vin ?? null;
  }

  if (resolvedVin) {
    // Ensure vehicle exists — it may have been added by other sources
    const vehicle = await prisma.vehicle.findUnique({ where: { vin: resolvedVin } });

    if (!vehicle) {
      // Create minimal vehicle record from stolen report data
      await prisma.vehicle.create({
        data: {
          vin: resolvedVin,
          color: report['carColor'] as string,
        },
      });

      // Create plate-VIN mapping if VIN was user-provided
      if (vin) {
        await prisma.plateVinMap.upsert({
          where: { id: `${plate}-${resolvedVin}` },
          create: {
            plate,
            plateDisplay: formatPlateDisplay(plate),
            vin: resolvedVin,
            confidence: 0.4,
            source: 'contribution',
          },
          update: {},
        });
      }
    }

    // Insert STOLEN vehicle event
    await prisma.vehicleEvent.create({
      data: {
        vin: resolvedVin,
        eventType: 'STOLEN',
        eventDate: dateStolenDate,
        county,
        source: 'community_stolen_report',
        sourceRef: stolenReportId,
        confidence: 0.8,
        metadata: ({
          stolenReportId,
          policeObNumber: report['policeObNumber'],
          isObVerified: report['isObVerified'],
          carColor: report['carColor'],
        }) as any,
      },
    });

    // Mark all existing reports stale → risk score recalculates to CRITICAL
    await prisma.report.updateMany({
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
    plateDisplay: (row['plateDisplay'] as string | null) ?? null,
    vin: (row['vin'] as string | null) ?? null,
    reporterUserId: (row['reporterUserId'] as string | null) ?? null,
    reporterType: row['reporterType'] as 'owner' | 'family' | 'witness' | 'police',
    dateStolenIso:
      row['dateStolen'] instanceof Date
        ? row['dateStolen'].toISOString().split('T')[0]
        : (row['dateStolen'] as string),
    countyStolen: row['countyStolen'] as string,
    townStolen: row['townStolen'] as string,
    policeObNumber: (row['policeObNumber'] as string | null) ?? null,
    policeStation: (row['policeStation'] as string | null) ?? null,
    carColor: row['carColor'] as string,
    identifyingMarks: (row['identifyingMarks'] as string | null) ?? null,
    photoUrls: (row['photoUrls'] as string[]) ?? [],
    contactPhone: (row['contactPhone'] as string | null) ?? null,
    contactEmail: (row['contactEmail'] as string | null) ?? null,
    status: row['status'] as StolenStatus,
    isObVerified: Boolean(row['isObVerified']),
    adminNote: (row['adminNote'] as string | null) ?? null,
    reviewedBy: (row['reviewedBy'] as string | null) ?? null,
    reviewedAt: row['reviewedAt'] ? new Date(row['reviewedAt'] as string) : null,
    recoveryDate:
      row['recoveryDate'] instanceof Date
        ? (row['recoveryDate'] as Date).toISOString().split('T')[0]
        : ((row['recoveryDate'] as string | null) ?? null),
    recoveryCounty: (row['recoveryCounty'] as string | null) ?? null,
    recoveryNotes: (row['recoveryNotes'] as string | null) ?? null,
    createdAt: new Date(row['createdAt'] as string),
  };
}
