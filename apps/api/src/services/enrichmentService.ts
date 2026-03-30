// apps/api/src/services/enrichmentService.ts
//
// Applies approved contributions to the live vehicle record.
// Called by contributionService.moderate() when status → 'approved'.

import prisma from '../lib/prisma';
import type { ContribType } from '../types/contribution.types.js';

interface ContributionRow {
  id: string;
  vin: string;
  type: ContribType;
  title: string;
  description: string | null;
  data: Record<string, unknown> | null;
  evidence_urls: string[];
  confidenceScore: number | null;
}

/**
 * Apply an approved contribution to the vehicle record and events table.
 * This is deliberately conservative — we only write things we can trust.
 */
export async function applyContribution(contribution: ContributionRow): Promise<void> {
  const { vin, type, data } = contribution;
  const confidence = contribution.confidenceScore ?? 0.4;

  switch (type) {
    case 'MILEAGE_RECORD':
      await applyMileageRecord(vin, data, confidence);
      break;
    case 'DAMAGE_REPORT':
      await applyDamageReport(vin, data, confidence);
      break;
    case 'SERVICE_RECORD':
      await applyServiceRecord(vin, contribution, confidence);
      break;
    case 'OWNERSHIP_TRANSFER':
      await applyOwnershipTransfer(vin, data, confidence);
      break;
    case 'INSPECTION_RECORD':
      await applyInspectionRecord(vin, data, confidence);
      break;
    case 'IMPORT_DOCUMENT':
      await applyImportDocument(vin, data, confidence);
      break;
    case 'THEFT_REPORT':
      // Theft contributions are advisory only; use stolenReportService for formal reports
      await applyGenericEvent(vin, 'STOLEN', data, confidence, contribution.id);
      break;
    case 'LISTING_PROOF':
      await applyGenericEvent(vin, 'LISTED_FOR_SALE', data, confidence, contribution.id);
      break;
    case 'PHOTO_EVIDENCE':
    case 'GENERAL_NOTE':
      // No vehicle record changes — metadata only, surfaced in report
      await applyGenericEvent(vin, 'CONTRIBUTION_ADDED', data, confidence, contribution.id);
      break;
    default:
      break;
  }

  // After enrichment, mark existing reports as stale so they regenerate
  await prisma.reports.updateMany({
    where: { vin },
    data: { status: 'stale' },
  });
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

async function applyMileageRecord(
  vin: string,
  data: Record<string, unknown> | null,
  confidence: number,
): Promise<void> {
  if (!data?.mileage || !data?.date) return;

  await prisma.vehicle_events.create({
    data: {
      vin,
      event_type: 'SERVICED', // Mileage records often come from service visits
      event_date: new Date(data.date as string),
      source: 'contribution',
      confidence,
      metadata: { mileage: data.mileage, source: 'contribution' },
    },
  });
}

async function applyDamageReport(
  vin: string,
  data: Record<string, unknown> | null,
  confidence: number,
): Promise<void> {
  await prisma.vehicle_events.create({
    data: {
      vin,
      event_type: 'DAMAGED',
      event_date: data?.date ? new Date(data.date as string) : new Date(),
      county: (data?.county as string) ?? null,
      source: 'contribution',
      confidence,
      metadata: (data ?? {}) as any,
    },
  });
}

async function applyServiceRecord(
  vin: string,
  contribution: ContributionRow,
  confidence: number,
): Promise<void> {
  const data = contribution.data;
  await prisma.vehicle_events.create({
    data: {
      vin,
      event_type: 'SERVICED',
      event_date: data?.date ? new Date(data.date as string) : new Date(),
      county: (data?.county as string) ?? null,
      source: 'contribution',
      confidence,
      metadata: ({
        garageName: data?.garageName,
        mileage: data?.mileage,
        workDone: contribution.description,
        ...data,
      }) as any,
    },
  });
}

async function applyOwnershipTransfer(
  vin: string,
  data: Record<string, unknown> | null,
  confidence: number,
): Promise<void> {
  await prisma.vehicle_events.create({
    data: {
      vin,
      event_type: 'OWNERSHIP_CHANGE',
      event_date: data?.date ? new Date(data.date as string) : new Date(),
      source: 'contribution',
      confidence,
      metadata: (data ?? {}) as any,
    },
  });
}

async function applyInspectionRecord(
  vin: string,
  data: Record<string, unknown> | null,
  confidence: number,
): Promise<void> {
  const eventType =
    data?.passed === false ? 'INSPECTION_FAILED' : 'INSPECTED';

  await prisma.vehicle_events.create({
    data: {
      vin,
      event_type: eventType as any,
      event_date: data?.date ? new Date(data.date as string) : new Date(),
      county: (data?.county as string) ?? null,
      source: 'contribution',
      confidence,
      metadata: (data ?? {}) as any,
    },
  });
}

async function applyImportDocument(
  vin: string,
  data: Record<string, unknown> | null,
  confidence: number,
): Promise<void> {
  await prisma.vehicle_events.create({
    data: {
      vin,
      event_type: 'IMPORTED',
      event_date: data?.importDate ? new Date(data.importDate as string) : new Date(),
      source: 'contribution',
      confidence,
      metadata: (data ?? {}) as any,
    },
  });
}

async function applyGenericEvent(
  vin: string,
  eventType: string,
  data: Record<string, unknown> | null,
  confidence: number,
  sourceRef: string,
): Promise<void> {
  await prisma.vehicle_events.create({
    data: {
      vin,
      event_type: eventType as any,
      event_date: new Date(),
      source: 'contribution',
      source_ref: sourceRef,
      confidence,
      metadata: (data ?? {}) as any,
    },
  });
}
