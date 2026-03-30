// apps/api/src/services/contributionService.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ContributionType = 'odometer' | 'service_record' | 'damage' | 'listing_photo';
export type ContributionStatus = 'pending' | 'approved' | 'rejected' | 'disputed' | 'needs_more_info' | 'archived';

export interface ContributionData {
  odometer?: { value: number; unit: 'km' | 'miles'; dateObserved: string };
  serviceRecord?: { date: string; garageName: string; mileage: number; workSummary: string };
  damage?: { date: string; location: string; optionalCostRange?: string };
  listingPhoto?: { sourceUrl?: string; notes?: string };
}

export interface CreateContributionInput {
  plate: string;
  vin?: string;
  type: ContributionType;
  data: ContributionData;
  evidenceUrls: string[];
  userId: string;
}

/**
 * Create a new contribution. Starts in 'pending' for moderation.
 * All records are immutable — rejected records are retained for audit.
 */
export async function createContribution(input: CreateContributionInput) {
  const contribution = await (prisma as any).contribution.create({
    data: {
      plate: input.plate.toUpperCase(),
      vin: input.vin ?? null,
      type: input.type,
      userId: input.userId,
      dataJson: input.data as any,
      evidenceUrls: input.evidenceUrls,
      status: 'pending',
    },
  });

  return contribution;
}

/**
 * Moderate a contribution. Status transitions are append-only — no delete.
 * Approved contributions enrich reports but never overwrite canonical records.
 */
export async function moderateContribution(
  contributionId: string,
  status: ContributionStatus,
  moderatorNote?: string,
  moderatorId?: string
) {
  const updated = await (prisma as any).contribution.update({
    where: { id: contributionId },
    data: {
      status,
      moderatorNote: moderatorNote ?? null,
      moderatedBy: moderatorId ?? null,
      moderatedAt: new Date(),
    },
  });

  // If approved, trigger report enrichment (non-blocking)
  if (status === 'approved') {
    enrichReportFromContribution(updated).catch((err) =>
      console.error('[contributionService] enrichReportFromContribution failed:', err)
    );
  }

  return updated;
}

/**
 * Fetch contributions for moderation queue (admin use).
 */
export async function getPendingContributions(limit = 50, offset = 0) {
  const [items, total] = await Promise.all([
    (prisma as any).contribution.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    }),
    (prisma as any).contribution.count({ where: { status: 'pending' } }),
  ]);

  return { items, total };
}

/**
 * Fetch approved contributions for a given vehicle (for report enrichment).
 */
export async function getApprovedContributions(plate: string, vin?: string) {
  return (prisma as any).contribution.findMany({
    where: {
      OR: [{ plate }, ...(vin ? [{ vin }] : [])],
      status: 'approved',
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Fetch all contributions for a vehicle (for admin/report view — all statuses).
 */
export async function getAllContributionsForVehicle(plate: string, vin?: string) {
  return (prisma as any).contribution.findMany({
    where: {
      OR: [{ plate }, ...(vin ? [{ vin }] : [])],
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Enrich a report from an approved contribution.
 * Approved contributions NEVER overwrite records with confidence >= 0.8.
 * Contribution trust cap: 0.4.
 */
async function enrichReportFromContribution(contribution: any) {
  const CONTRIBUTION_CONFIDENCE_CAP = 0.4;

  // Check if a canonical record already covers this field with higher confidence
  const existing = await (prisma as any).rawRecord.findFirst({
    where: {
      OR: [
        { plate: contribution.plate },
        ...(contribution.vin ? [{ vin: contribution.vin }] : []),
      ],
      source: { not: 'community_contribution' },
      confidence: { gte: 0.8 },
    },
  });

  // Do not overwrite strong canonical records
  if (existing) {
    console.info(
      `[contributionService] Skipping enrichment — canonical record with confidence ${existing.confidence} exists for ${contribution.plate}`
    );
    return;
  }

  await (prisma as any).rawRecord.create({
    data: {
      plate: contribution.plate,
      vin: contribution.vin ?? null,
      source: 'community_contribution',
      sourceId: `contribution_${contribution.id}`,
      rawJson: contribution.dataJson,
      normalisedJson: contribution.dataJson,
      confidence: CONTRIBUTION_CONFIDENCE_CAP,
    },
  });
}
