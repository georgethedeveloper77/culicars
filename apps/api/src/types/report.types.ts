// ============================================================
// CuliCars — Thread 5: Report Types
// ============================================================

// ---- Section Types ----

export const SECTION_TYPES = [
  'IDENTITY',
  'PURPOSE',
  'THEFT',
  'ODOMETER',
  'LEGAL',
  'DAMAGE',
  'SPECS_EQUIPMENT',
  'IMPORT',
  'OWNERSHIP',
  'SERVICE',
  'PHOTOS',
  'TIMELINE',
  'STOLEN_REPORTS',
  'RECOMMENDATION',
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

// FREE sections — never locked
export const FREE_SECTIONS: SectionType[] = [
  'IDENTITY',
  'SPECS_EQUIPMENT',
  'STOLEN_REPORTS',
];

// ---- Risk Scoring ----

export type RiskLevel = 'clean' | 'low' | 'medium' | 'high' | 'critical';
export type Recommendation = 'proceed' | 'caution' | 'avoid';

export interface RiskBreakdown {
  category: string;
  points: number;
  description: string;
}

export interface RiskResult {
  score: number;         // 0–100
  level: RiskLevel;
  recommendation: Recommendation;
  breakdown: RiskBreakdown[];
}

// ---- Section Data Shapes ----

export interface IdentitySectionData {
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  engineCc: number | null;
  fuelType: string | null;
  transmission: string | null;
  bodyType: string | null;
  color: string | null;
  countryOfOrigin: string | null;
  chassisNumber: string | null;
  ntsaCorVerified: boolean;
  plates: Array<{
    plate: string;
    plateDisplay: string;
    confidence: number;
    source: string;
  }>;
}

export interface PurposeCheckCard {
  type: string;           // PSV, Taxi, Rental, Transport, Police, DrivingSchool, Ambulance
  label: string;
  found: boolean;
  source?: string;
  details?: string;
}

export interface PurposeSectionData {
  checks: PurposeCheckCard[];
  hasCommercialHistory: boolean;
}

export interface TheftCheckCard {
  database: string;       // CuliCars Community, Kenya Police, Interpol
  checked: boolean;
  found: boolean;
  details?: string;
}

export interface TheftSectionData {
  currentlyWanted: boolean;
  stolenInPast: boolean;
  recovered: boolean;
  checks: TheftCheckCard[];
  communityReports: Array<{
    dateStolen: string;
    county: string;
    obNumber: string | null;
    status: string;
    isObVerified: boolean;
  }>;
}

export interface MileageRecord {
  date: string;
  mileage: number;
  source: string;
  isRollback: boolean;
}

export interface OdometerSectionData {
  lastKnownMileage: number | null;
  averageForSimilar: number | null;
  similarDescription: string | null;  // e.g. "2014 Toyota Fielders"
  records: MileageRecord[];
  rollbackDetected: boolean;
  rollbackCount: number;
  chartData: Array<{ date: string; mileage: number; isRollback: boolean }>;
}

export interface LegalCheckCard {
  type: string;           // logbook_loan, hire_purchase, unit_stocking, inspection, caveat, scrap, export_import, insurance_writeoff
  label: string;
  category: 'financial' | 'legal';
  found: boolean;
  details?: string;
  date?: string;
  county?: string;
}

export interface LegalSectionData {
  financialRestrictions: LegalCheckCard[];
  legalChecks: LegalCheckCard[];
  hasFinancialIssues: boolean;
  hasLegalIssues: boolean;
}

export interface DamageIncident {
  id: string;
  location: string;           // e.g. "Front right / Bumper"
  locationCode: string;       // for 3D diagram positioning
  severity: 'damage' | 'severe';
  repairCostMin: number;      // KES
  repairCostMax: number;      // KES
  date?: string;
  county?: string;
  possibleCause: string;      // "Collision", "Hail", "Flood", "Unknown"
  source: string;
  structuralWarning: boolean;
}

export interface DamageSectionData {
  incidents: DamageIncident[];
  totalIncidents: number;
  hasSevereDamage: boolean;
  hasStructuralDamage: boolean;
  diagramLocations: Array<{
    code: string;
    severity: 'damage' | 'severe';
    label: string;
  }>;
}

export interface VinOptionCode {
  category: string;      // e.g. "Safety", "Interior", "Powertrain"
  code: string;
  label: string;
  value: string;
}

export interface SpecsEquipmentSectionData {
  basicSpecs: {
    make: string | null;
    model: string | null;
    bodyType: string | null;
    year: number | null;
    engineCc: number | null;
    power: string | null;
    transmission: string | null;
    driveLayout: string | null;
    plantCountry: string | null;
  };
  optionCodes: VinOptionCode[];
  kenyaAdditions: {
    steeringSide: string;       // RHD for most JDM imports
    emissionStandard: string | null;
    countryOfFirstReg: string | null;
  };
  japanAuction: {
    grade: string | null;       // 3, 3.5, 4, 4.5, 5
    mileageAtExport: number | null;
    auctionHouse: string | null;
  } | null;
  importDetails: {
    originCountry: string | null;
    importDate: string | null;
    kraClearanceStatus: string | null;
  };
}

export interface ImportSectionData {
  originCountry: string | null;
  importCountry: string | null;
  isImported: boolean;
  japanAuction: {
    grade: string | null;
    mileageAtExport: number | null;
    auctionHouse: string | null;
    damageMap: string | null;
  } | null;
  kraDetails: {
    clearanceStatus: string | null;
    importDate: string | null;
    kraPin: string | null;
  };
  beForwardData: Record<string, unknown> | null;
}

export interface OwnershipSectionData {
  transferCount: number;
  transfers: Array<{
    date: string;
    county?: string;
    source: string;
  }>;
  highTurnover: boolean;  // 4+ changes
}

export interface ServiceEntry {
  date: string;
  garageName: string;
  county?: string;
  mileage?: number;
  workDone: string;
  workTypes: string[];    // oil_change, brake_service, etc.
  source: string;
}

export interface ServiceSectionData {
  entries: ServiceEntry[];
  totalServices: number;
  lastServiceDate: string | null;
  mileageVerification: boolean;  // service records help verify odometer
}

export interface PhotoGroup {
  date: string;       // YYYY-MM format
  count: number;
  photos: Array<{
    url: string;
    source: string;
    caption?: string;
  }>;
}

export interface PhotosSectionData {
  groups: PhotoGroup[];
  totalPhotos: number;
}

export interface TimelineEvent {
  date: string;
  eventType: string;
  description: string;
  county?: string;
  country: string;
  source: string;
  sourceRef?: string;
}

export interface TimelineSectionData {
  events: TimelineEvent[];
  totalEvents: number;
  firstEvent: string | null;   // earliest date
  lastEvent: string | null;    // latest date
}

export interface StolenReportEntry {
  dateStolen: string;
  county: string;
  town: string;
  obNumber: string | null;
  isObVerified: boolean;
  status: string;
  carColor: string;
  recoveryDate: string | null;
  reportedAt: string;
}

export interface StolenReportsSectionData {
  hasActiveReport: boolean;
  totalReports: number;
  reports: StolenReportEntry[];
}

export interface RecommendationSectionData {
  recommendation: Recommendation;
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  keyFindings: Array<{
    category: string;
    finding: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  breakdown: RiskBreakdown[];
}

// Union of all section data types
export type SectionData =
  | IdentitySectionData
  | PurposeSectionData
  | TheftSectionData
  | OdometerSectionData
  | LegalSectionData
  | DamageSectionData
  | SpecsEquipmentSectionData
  | ImportSectionData
  | OwnershipSectionData
  | ServiceSectionData
  | PhotosSectionData
  | TimelineSectionData
  | StolenReportsSectionData
  | RecommendationSectionData;

// ---- Report Response Shapes ----

export interface ReportSection {
  id: string;
  sectionType: SectionType;
  data: SectionData | null;
  isLocked: boolean;
  recordCount: number;
  dataStatus: 'found' | 'not_found' | 'not_checked';
}

export interface ReportPreview {
  id: string;
  vin: string;
  status: string;
  riskScore: number | null;
  riskLevel: RiskLevel | null;
  recommendation: Recommendation | null;
  sourcesChecked: number;
  recordsFound: number;
  generatedAt: string | null;
  vehicle: {
    make: string | null;
    model: string | null;
    year: number | null;
    color: string | null;
    bodyType: string | null;
  };
  plates: Array<{ plate: string; plateDisplay: string }>;
  sectionSummary: Array<{
    sectionType: SectionType;
    isLocked: boolean;
    dataStatus: 'found' | 'not_found' | 'not_checked';
    recordCount: number;
  }>;
  stolenAlert: {
    active: boolean;
    reportCount: number;
  };
}

export interface FullReport extends ReportPreview {
  sections: ReportSection[];
}

export interface UnlockResult {
  success: boolean;
  creditsSpent: number;
  balanceAfter: number;
  reportId: string;
}
