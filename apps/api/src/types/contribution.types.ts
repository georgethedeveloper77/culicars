// apps/api/src/types/contribution.types.ts

export type ContribType =
  | 'MILEAGE_RECORD'
  | 'DAMAGE_REPORT'
  | 'SERVICE_RECORD'
  | 'OWNERSHIP_TRANSFER'
  | 'LISTING_PROOF'
  | 'INSPECTION_RECORD'
  | 'IMPORT_DOCUMENT'
  | 'THEFT_REPORT'
  | 'PHOTO_EVIDENCE'
  | 'GENERAL_NOTE';

export type ContribStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

export interface ContributionSubmission {
  vin: string;
  type: ContribType;
  title: string;
  description?: string;
  data?: Record<string, unknown>;
  evidenceUrls?: string[];
  verificationDocUrls?: string[];
}

export interface ContributionModeration {
  status: 'approved' | 'rejected' | 'flagged';
  adminNote?: string;
}

export interface ContributionRecord {
  id: string;
  vin: string;
  userId: string | null;
  type: ContribType;
  title: string;
  description: string | null;
  data: Record<string, unknown> | null;
  evidenceUrls: string[];
  verificationDocUrls: string[];
  status: ContribStatus;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  confidenceScore: number | null;
  createdAt: Date;
}

export interface ConfidenceFactors {
  hasPhotos: boolean;
  hasVerificationDocs: boolean;
  isAuthenticatedUser: boolean;
  contribType: ContribType;
  dataCompleteness: number; // 0-1
}
