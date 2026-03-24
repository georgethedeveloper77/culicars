// apps/admin/src/types/admin.types.ts

export type RiskLevel = 'clean' | 'low' | 'medium' | 'high' | 'critical';
export type ReportStatus = 'draft' | 'ready' | 'stale';
export type ContribStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type StolenStatus = 'pending' | 'active' | 'recovered' | 'rejected' | 'duplicate';
export type JobStatus = 'queued' | 'running' | 'completed' | 'failed';
export type PayStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface AdminUser {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'dealer' | 'guest';
  createdAt: string;
  profile?: {
    displayName?: string;
    phone?: string;
    county?: string;
  };
  wallet?: { balance: number };
}

export interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  engineCc?: number;
  fuelType?: string;
  transmission?: string;
  inspectionStatus?: string;
  caveatStatus?: string;
  ntsaCorVerified?: boolean;
  riskLevel?: RiskLevel;
  createdAt: string;
}

export interface Report {
  id: string;
  vin: string;
  status: ReportStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  recommendation: string;
  sourcesChecked: number;
  recordsFound: number;
  generatedAt?: string;
  vehicle?: Vehicle;
}

export interface Contribution {
  id: string;
  vin: string;
  type: string;
  title: string;
  description?: string;
  status: ContribStatus;
  adminNote?: string;
  confidenceScore?: number;
  createdAt: string;
  user?: Pick<AdminUser, 'id' | 'email'>;
  evidenceUrls?: string[];
}

export interface StolenReport {
  id: string;
  plate: string;
  plateDisplay?: string;
  vin?: string;
  reporterType: string;
  dateStolenString: string;
  countyStolen: string;
  townStolen: string;
  policeObNumber?: string;
  policeStation?: string;
  carColor: string;
  identifyingMarks?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: StolenStatus;
  isObVerified: boolean;
  adminNote?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface OcrScan {
  id: string;
  documentType: string;
  extractedPlate?: string;
  extractedVin?: string;
  confidence?: number;
  source: string;
  createdAt: string;
  user?: Pick<AdminUser, 'id' | 'email'>;
}

export interface Payment {
  id: string;
  userId: string;
  provider: string;
  amount: number;
  currency: string;
  credits: number;
  status: PayStatus;
  providerRef?: string;
  createdAt: string;
  user?: Pick<AdminUser, 'id' | 'email'>;
}

export interface PaymentProvider {
  id: string;
  name: string;
  slug: string;
  isEnabled: boolean;
  config?: Record<string, string>;
  updatedAt?: string;
}

export interface ScraperJob {
  id: string;
  source: string;
  status: JobStatus;
  trigger: string;
  itemsFound: number;
  itemsStored: number;
  itemsSkipped: number;
  startedAt?: string;
  completedAt?: string;
  errorLog?: string;
  createdAt: string;
}

export interface CreditLedgerEntry {
  id: string;
  type: string;
  creditsDelta: number;
  balanceBefore: number;
  balanceAfter: number;
  source?: string;
  txRef?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalReports: number;
  pendingContributions: number;
  pendingStolenReports: number;
  totalRevenue: number;
  activeVehicles: number;
  recentReports: Report[];
  recentPayments: Payment[];
}
