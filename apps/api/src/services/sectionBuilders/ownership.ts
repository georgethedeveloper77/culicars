// apps/api/src/services/sectionBuilders/ownership.ts

export interface OwnershipSection {
  sectionType: 'ownership';
  locked: boolean;
  verified: boolean;
  confidence: number;
  ownerCount: number | null;
  lastTransferDate: string | null;
  verificationRequired: boolean;
}

export function buildOwnershipSection(
  records: any[],
  isUnlocked: boolean
): OwnershipSection {
  // Owner PII is never stored per platform rules.
  // We surface transfer count and confidence only.
  const corRecord = records.find((r) => r.source === 'ntsa_cor');

  const confidence = corRecord ? (corRecord.confidence ?? 1.0) : 0.3;
  const verified = confidence >= 0.9;

  const ownerCount = corRecord?.normalised_json?.owner_count ?? null;
  const lastTransferDate = corRecord?.normalised_json?.last_transfer_date ?? null;

  return {
    sectionType: 'ownership',
    locked: !isUnlocked,
    verified,
    confidence: Math.round(confidence * 100) / 100,
    ownerCount: isUnlocked ? ownerCount : null,
    lastTransferDate: isUnlocked ? lastTransferDate : null,
    verificationRequired: !verified,
  };
}
