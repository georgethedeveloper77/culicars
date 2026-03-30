// apps/api/src/types/stolen_report.types.ts

export type ReporterType = 'owner' | 'family' | 'witness' | 'police';
export type StolenStatus = 'pending' | 'active' | 'recovered' | 'rejected' | 'duplicate';

export interface StolenReportSubmission {
  plate: string;
  vin?: string;
  dateStolenIso: string; // ISO date string YYYY-MM-DD
  county_stolen: string;
  town_stolen: string;
  policeObNumber?: string;
  policeStation?: string;
  car_color: string;
  identifyingMarks?: string;
  photoUrls?: string[];
  contactPhone?: string;
  contactEmail?: string;
  reporter_type: ReporterType;
}

export interface StolenReportReview {
  status: 'active' | 'rejected' | 'duplicate';
  adminNote?: string;
  isObVerified?: boolean;
}

export interface RecoverySubmission {
  recovery_date: string; // ISO date YYYY-MM-DD
  recovery_county: string;
  recoveryNotes?: string;
}

export interface StolenReportRecord {
  id: string;
  plate: string;
  plate_display: string | null;
  vin: string | null;
  reporter_user_id: string | null;
  reporter_type: ReporterType;
  dateStolenIso: string;
  county_stolen: string;
  town_stolen: string;
  police_ob_number: string | null;
  police_station: string | null;
  car_color: string;
  identifyingMarks: string | null;
  photoUrls: string[];
  contactPhone: string | null;
  contactEmail: string | null;
  status: StolenStatus;
  is_ob_verified: boolean;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  recovery_date: string | null;
  recovery_county: string | null;
  recovery_notes: string | null;
  created_at: Date;
}

export interface StolenAlertResult {
  hasActiveReport: boolean;
  reports: StolenReportRecord[];
}
