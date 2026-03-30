// apps/api/src/services/verificationService.ts

import { PrismaClient } from '@prisma/client';
import { ntsaCorParser } from './ntsaCorParser';

const prisma = new PrismaClient();

// Read ntsa_fetch_enabled from admin config table directly
// (avoids import cycle with adminConfigService)
async function getNtsaFetchEnabled(): Promise<boolean> {
  try {
    const row = await (prisma as any).adminConfig.findUnique({
      where: { key: 'ntsa_fetch_enabled' },
    });
    return row?.value === true || row?.value === 'true';
  } catch {
    return false;
  }
}

export interface VerificationResult {
  success: boolean;
  status: 'completed' | 'failed' | 'manual_required';
  message: string;
  verificationId?: string;
  corFields?: Record<string, any>;
}

/**
 * Initiate or look up a verification attempt for a vehicle + user combo.
 * Returns existing entry if already verified within the last 30 days.
 */
export async function initiateVerification(
  userId: string,
  plate: string,
  vin?: string
): Promise<{ verificationId: string; alreadyVerified: boolean }> {
  const existing = await (prisma as any).vehicleVerification.findFirst({
    where: {
      userId,
      plate,
      status: 'completed',
      completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { completedAt: 'desc' },
  });

  if (existing) {
    return { verificationId: existing.id, alreadyVerified: true };
  }

  const entry = await (prisma as any).vehicleVerification.create({
    data: { userId, plate, vin: vin ?? null, status: 'pending' },
  });

  return { verificationId: entry.id, alreadyVerified: false };
}

/**
 * Attempt live NTSA COR fetch. Controlled by ntsa_fetch_enabled config key.
 * Falls back gracefully — never throws to caller.
 */
export async function attemptLiveFetch(
  verificationId: string,
  plate: string
): Promise<VerificationResult> {
  const enabled = await getNtsaFetchEnabled();

  if (!enabled) {
    await (prisma as any).vehicleVerification.update({
      where: { id: verificationId },
      data: { status: 'manual_upload' },
    });
    return {
      success: false,
      status: 'manual_required',
      message: 'Live verification is currently unavailable. Please upload your COR document manually.',
      verificationId,
    };
  }

  try {
    // Live fetch integrates with NTSA portal here — deferred until access confirmed.
    throw new Error('Live NTSA fetch not yet implemented');
  } catch {
    await (prisma as any).vehicleVerification.update({
      where: { id: verificationId },
      data: { status: 'manual_upload' },
    });
    return {
      success: false,
      status: 'manual_required',
      message: 'Could not connect to official records. Please upload your COR document manually.',
      verificationId,
    };
  }
}

/**
 * Process a manually uploaded COR PDF.
 * Parses fields, strips PII, stores result, marks verification complete.
 */
export async function processCORUpload(
  verificationId: string,
  pdfBuffer: Buffer,
  userId: string
): Promise<VerificationResult> {
  const entry = await (prisma as any).vehicleVerification.findFirst({
    where: { id: verificationId, userId },
  });

  if (!entry) {
    return { success: false, status: 'failed', message: 'Verification record not found.' };
  }

  // ntsaCorParser.parse() accepts raw text; convert buffer to string
  const rawText = pdfBuffer.toString('utf-8');
  const parseResult = ntsaCorParser.parse(rawText);

  if (!parseResult.success || !parseResult.fields) {
    await (prisma as any).vehicleVerification.update({
      where: { id: verificationId },
      data: { status: 'failed' },
    });
    return {
      success: false,
      status: 'failed',
      message: 'Could not parse the uploaded document. Please ensure it is a valid COR PDF.',
    };
  }

  // Strip owner PII permanently before any storage
  const {
    ownerName: _ownerName,
    ownerId: _ownerId,
    ownerAddress: _ownerAddress,
    owner_name: _on,
    owner_id: _oi,
    owner_address: _oa,
    ...safeFields
  } = parseResult.fields as any;

  await (prisma as any).vehicleVerification.update({
    where: { id: verificationId },
    data: {
      status: 'completed',
      cor_fields: safeFields,
      completedAt: new Date(),
      vin: safeFields.vin ?? entry.vin,
    },
  });

  // Upsert into raw_records with high confidence
  if (entry.plate || safeFields.plate) {
    await (prisma as any).rawRecord.create({
      data: {
        plate: entry.plate ?? safeFields.plate,
        vin: safeFields.vin ?? entry.vin ?? null,
        source: 'ntsa_cor',
        source_id: `ntsa_cor_${entry.plate}_${Date.now()}`,
        raw_json: safeFields,
        normalised_json: safeFields,
        confidence: 1.0,
      },
    });
  }

  return {
    success: true,
    status: 'completed',
    message: 'Verification complete. Report updated with official records.',
    verificationId,
    corFields: safeFields,
  };
}

/**
 * Retrieve the latest completed verification for a vehicle.
 */
export async function getVerificationStatus(
  userId: string,
  plate: string
): Promise<{ verified: boolean; completedAt?: Date; corFields?: Record<string, any> }> {
  const entry = await (prisma as any).vehicleVerification.findFirst({
    where: { userId, plate, status: 'completed' },
    orderBy: { completedAt: 'desc' },
  });

  if (!entry) return { verified: false };
  return { verified: true, completedAt: entry.completedAt, corFields: entry.cor_fields };
}
