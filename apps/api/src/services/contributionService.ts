// apps/api/src/services/contributionService.ts

import prisma from '../lib/prisma';
import { scoreContribution, buildFactors } from './confidenceScorer.js';
import { applyContribution } from './enrichmentService.js';
import type {
  ContributionSubmission,
  ContributionModeration,
  ContributionRecord,
  ContribType,
} from '../types/contribution.types.js';

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

export async function submitContribution(
  submission: ContributionSubmission,
  userId: string | null,
): Promise<ContributionRecord> {
  // Ensure vehicle exists
  const vehicle = await prisma.vehicle.findUnique({ where: { vin: submission.vin } });
  if (!vehicle) {
    throw Object.assign(new Error(`Vehicle not found: ${submission.vin}`), { status: 404 });
  }

  const factors = buildFactors({
    contribType: submission.type as ContribType,
    evidenceUrls: submission.evidenceUrls ?? [],
    verificationDocUrls: submission.verificationDocUrls ?? [],
    isAuthenticatedUser: userId !== null,
    dataFields: (submission.data as Record<string, unknown>) ?? {},
  });

  const confidenceScore = scoreContribution(factors);

  const record = await prisma.contribution.create({
    data: {
      vin: submission.vin,
      userId: userId,
      type: submission.type,
      title: submission.title.trim(),
      description: submission.description?.trim() ?? null,
      data: (submission.data ?? {}) as any,
      evidenceUrls: submission.evidenceUrls ?? [],
      verificationDocUrls: submission.verificationDocUrls ?? [],
      status: 'pending',
      confidenceScore: confidenceScore,
    },
  });

  return mapContribution(record);
}

// ---------------------------------------------------------------------------
// List by VIN
// ---------------------------------------------------------------------------

export async function getContributionsByVin(
  vin: string,
  includeAll = false,
): Promise<ContributionRecord[]> {
  const where: Record<string, unknown> = { vin };
  if (!includeAll) {
    where['status'] = 'approved';
  }

  const rows = await prisma.contribution.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return rows.map(mapContribution);
}

// ---------------------------------------------------------------------------
// Moderate (admin)
// ---------------------------------------------------------------------------

export async function moderateContribution(
  id: string,
  moderation: ContributionModeration,
  adminUserId: string,
): Promise<ContributionRecord> {
  const existing = await prisma.contribution.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error('Contribution not found'), { status: 404 });
  }

  const updated = await prisma.contribution.update({
    where: { id },
    data: {
      status: moderation.status,
      adminNote: moderation.adminNote ?? null,
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
    },
  });

  // Apply to vehicle record if approved
  if (moderation.status === 'approved') {
    const contributionRow = {
      id: updated.id,
      vin: updated.vin,
      type: updated.type as ContribType,
      title: updated.title,
      description: updated.description,
      data: updated.data as Record<string, unknown> | null,
      evidenceUrls: updated.evidenceUrls as string[],
      confidenceScore: updated.confidenceScore ? Number(updated.confidenceScore) : null,
    };
    await applyContribution(contributionRow);
  }

  return mapContribution(updated);
}

// ---------------------------------------------------------------------------
// Get single
// ---------------------------------------------------------------------------

export async function getContributionById(id: string): Promise<ContributionRecord | null> {
  const row = await prisma.contribution.findUnique({ where: { id } });
  return row ? mapContribution(row) : null;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapContribution(row: Record<string, unknown>): ContributionRecord {
  return {
    id: row['id'] as string,
    vin: row['vin'] as string,
    userId: (row['user_id'] as string | null) ?? null,
    type: row['type'] as ContribType,
    title: row['title'] as string,
    description: (row['description'] as string | null) ?? null,
    data: (row['data'] as Record<string, unknown> | null) ?? null,
    evidenceUrls: (row['evidence_urls'] as string[]) ?? [],
    verificationDocUrls: (row['verification_doc_urls'] as string[]) ?? [],
    status: row['status'] as 'pending' | 'approved' | 'rejected' | 'flagged',
    adminNote: (row['admin_note'] as string | null) ?? null,
    reviewedBy: (row['reviewed_by'] as string | null) ?? null,
    reviewedAt: row['reviewed_at'] ? new Date(row['reviewed_at'] as string) : null,
    confidenceScore: row['confidence_score'] ? Number(row['confidence_score']) : null,
    createdAt: new Date(row['created_at'] as string),
  };
}
