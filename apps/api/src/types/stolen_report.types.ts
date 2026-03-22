// apps/api/src/types/stolen_report.types.ts

export type ReporterType = 'owner' | 'family' | 'witness' | 'police';
export type StolenStatus = 'pending' | 'active' | 'recovered' | 'rejected' | 'duplicate';

export interface StolenReportSubmission {
  plate: string;
  vin?: string;
  dateStolenIso: string; // ISO date string YYYY-MM-DD
  countyStolen: string;
  townStolen: string;
  policeObNumber?: string;
  policeStation?: string;
  carColor: string;
  identifyingMarks?: string;
  photoUrls?: string[];
  contactPhone?: string;
  contactEmail?: string;
  reporterType: ReporterType;
}

export interface StolenReportReview {
  status: 'active' | 'rejected' | 'duplicate';
  adminNote?: string;
  isObVerified?: boolean;
}

export interface RecoverySubmission {
  recoveryDate: string; // ISO date YYYY-MM-DD
  recoveryCounty: string;
  recoveryNotes?: string;
}

export interface StolenReportRecord {
  id: string;
  plate: string;
  plateDisplay: string | null;
  vin: string | null;
  reporterUserId: string | null;
  reporterType: ReporterType;
  dateStolenIso: string;
  countyStolen: string;
  townStolen: string;
  policeObNumber: string | null;
  policeStation: string | null;
  carColor: string;
  identifyingMarks: string | null;
  photoUrls: string[];
  contactPhone: string | null;
  contactEmail: string | null;
  status: StolenStatus;
  isObVerified: boolean;
  adminNote: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  recoveryDate: string | null;
  recoveryCounty: string | null;
  recoveryNotes: string | null;
  createdAt: Date;
}

export interface StolenAlertResult {
  hasActiveReport: boolean;
  reports: StolenReportRecord[];
}
