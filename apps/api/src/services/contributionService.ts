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
  user_id: string | null,
): Promise<ContributionRecord> {
  // Ensure vehicle exists
  const vehicle = await prisma.vehicles.findUnique({ where: { vin: submission.vin } });
  if (!vehicle) {
    throw Object.assign(new Error(`Vehicle not found: ${submission.vin}`), { status: 404 });
  }

  const factors = buildFactors({
    contribType: submission.type as ContribType,
    evidence_urls: submission.evidenceUrls ?? [],
    verificationDocUrls: submission.verificationDocUrls ?? [],
    isAuthenticatedUser: userId !== null,
    dataFields: (submission.data as Record<string, unknown>) ?? {},
  });

  const confidenceScore = scoreContribution(factors);

  const record = await prisma.contributions.create({
    data: {
      vin: submission.vin,
      user_id: userId,
      type: submission.type,
      title: submission.title.trim(),
      description: submission.description?.trim() ?? null,
      data: (submission.data ?? {}) as any,
      evidence_urls: submission.evidenceUrls ?? [],
      verificationDocUrls: submission.verificationDocUrls ?? [],
      status: 'pending',
      confidence_score: confidenceScore,
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

  const rows = await prisma.contributions.findMany({
    where,
    orderBy: { created_at: 'desc' },
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
  const existing = await prisma.contributions.findUnique({ where: { id } });
  if (!existing) {
    throw Object.assign(new Error('Contribution not found'), { status: 404 });
  }

  const updated = await prisma.contributions.update({
    where: { id },
    data: {
      status: moderation.status,
      admin_note: moderation.adminNote ?? null,
      reviewed_by: adminUserId,
      reviewed_at: new Date(),
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
      evidence_urls: updated.evidence_urls as string[],
      confidenceScore: updated.confidence_score ? Number(updated.confidence_score) : null,
    };
    await applyContribution(contributionRow);
  }

  return mapContribution(updated);
}

// ---------------------------------------------------------------------------
// Get single
// ---------------------------------------------------------------------------

export async function getContributionById(id: string): Promise<ContributionRecord | null> {
  const row = await prisma.contributions.findUnique({ where: { id } });
  return row ? mapContribution(row) : null;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

function mapContribution(row: Record<string, unknown>): ContributionRecord {
  return {
    id: row['id'] as string,
    vin: row['vin'] as string,
    user_id: (row['user_id'] as string | null) ?? null,
    type: row['type'] as ContribType,
    title: row['title'] as string,
    description: (row['description'] as string | null) ?? null,
    data: (row['data'] as Record<string, unknown> | null) ?? null,
    evidence_urls: (row['evidence_urls'] as string[]) ?? [],
    verificationDocUrls: (row['verification_doc_urls'] as string[]) ?? [],
    status: row['status'] as 'pending' | 'approved' | 'rejected' | 'flagged',
    admin_note: (row['admin_note'] as string | null) ?? null,
    reviewed_by: (row['reviewed_by'] as string | null) ?? null,
    reviewed_at: row['reviewed_at'] ? new Date(row['reviewed_at'] as string) : null,
    confidenceScore: row['confidence_score'] ? Number(row['confidence_score']) : null,
    created_at: new Date(row['created_at'] as string),
  };
}
