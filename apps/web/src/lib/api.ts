// apps/web/src/lib/api.ts
// All API calls unwrap the { success, data } envelope returned by the Express API.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.culicars.com';

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// Unwrap { success, data } envelope used by all API routes
async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await apiFetch<{ success: boolean; data: T }>(path, {}, token);
  return res.data;
}

async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await apiFetch<{ success: boolean; data: T }>(
    path,
    { method: 'POST', body: JSON.stringify(body) },
    token
  );
  return res.data;
}

// ── Search ────────────────────────────────────────────────────────────────────

export interface SearchCandidate {
  vin: string;
  plate: string | null;
  plateDisplay: string | null;
  confidence: number;
  reportId: string | null;
  reportStatus: string | null;
  vehicle: {
    vin: string;
    make: string;
    model: string | null;
    year: number | null;
    bodyType: string | null;
    fuelType: string | null;
    color: string | null;
    engineCc: number | null;
    transmission: string | null;
    countryOfOrigin: string | null;
    importCountry: string | null;
    japanAuctionGrade: string | null;
    inspectionStatus: string | null;
    ntsaCorVerified: boolean;
  } | null;
}

export interface StolenAlert {
  active?: boolean;
  hasActiveReport?: boolean;
  date?: string;
  county?: string;
  obNumber?: string;
  reportCount?: number;
  reports?: Array<{
    id: string;
    dateStolenIso: string;
    countyStolen: string;
    townStolen: string;
    policeObNumber?: string | null;
    status: string;
    isObVerified: boolean;
    carColor?: string;
  }>;
}

export interface SearchResponse {
  query: string;
  queryType: 'plate' | 'vin' | 'unknown';
  normalizedQuery: string;
  candidates: SearchCandidate[];
  stolenAlert: StolenAlert;
  suggestions?: string[];
}

export const searchVehicles = async (q: string, token?: string): Promise<SearchResponse> =>
  apiGet<SearchResponse>(`/search?q=${encodeURIComponent(q)}&type=auto`, token);

// ── Reports ───────────────────────────────────────────────────────────────────

export interface ReportSection {
  id: string;
  sectionType: string;
  data: Record<string, unknown>;
  isLocked: boolean;
  recordCount: number;
  dataStatus: 'found' | 'not_found' | 'not_checked';
}

export interface Report {
  id: string;
  vin: string;
  status: string;
  riskScore: number;
  riskLevel: 'clean' | 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'proceed' | 'caution' | 'avoid';
  sourcesChecked: number;
  recordsFound: number;
  generatedAt: string;
  sections: ReportSection[];
  vehicle: {
    vin: string;
    make: string;
    model: string | null;
    year: number | null;
    bodyType: string | null;
    fuelType: string | null;
    color: string | null;
    engineCc: number | null;
    transmission: string | null;
    plate: string;
    plateDisplay: string;
    japanAuctionGrade: string | null;
    ntsaCorVerified: boolean;
    ntsa_cor_verified: boolean;
    countryOfOrigin: string | null;
    country_of_origin: string | null;
    importCountry: string | null;
    import_country: string | null;
    inspectionStatus: string | null;
  };
}

export const getReport = async (id: string, token?: string): Promise<Report> =>
  apiGet<Report>(`/reports/${id}`, token);

export const getReportByVin = async (vin: string, token?: string): Promise<Report> =>
  apiGet<Report>(`/reports/by-vin/${vin}`, token);

export const unlockReport = async (id: string, token: string) =>
  apiPost<{ creditsSpent: number; balanceAfter: number }>(
    `/reports/${id}/unlock`, {}, token
  );

// ── Stolen Reports ────────────────────────────────────────────────────────────

export interface StolenReport {
  id: string;
  plate: string;
  plateDisplay: string | null;
  vin?: string | null;
  reporterType: string;
  dateStolenIso: string;
  countyStolen: string;
  townStolen: string;
  policeObNumber?: string | null;
  policeStation?: string | null;
  carColor: string;
  identifyingMarks?: string | null;
  photoUrls: string[];
  status: 'pending' | 'active' | 'recovered' | 'rejected' | 'duplicate';
  isObVerified: boolean;
  recoveryDate?: string | null;
  recoveryCounty?: string | null;
  recoveryNotes?: string | null;
  createdAt: string;
}

export interface StolenReportSubmit {
  plate: string;
  vin?: string;
  dateStolenIso: string;
  countyStolen: string;
  townStolen: string;
  policeObNumber?: string;
  policeStation?: string;
  carColor: string;
  identifyingMarks?: string;
  contactPhone?: string;
  contactEmail?: string;
  reporterType: 'owner' | 'family' | 'witness' | 'police';
}

export const submitStolenReport = async (data: StolenReportSubmit) =>
  apiPost<{ id: string; message: string }>('/stolen-reports', data);

export const getStolenByPlate = async (plate: string) =>
  apiGet<{ reports: StolenReport[]; hasActiveReport: boolean }>(
    `/stolen-reports/plate/${plate}`
  );

export const markRecovered = async (
  id: string,
  data: { recoveryDate: string; recoveryCounty: string; recoveryNotes?: string },
  token: string
) => apiPost<{ success: boolean }>(`/stolen-reports/${id}/recovered`, data, token);

// ── Contributions ─────────────────────────────────────────────────────────────

export interface ContributionSubmit {
  vin: string;
  type: string;
  title: string;
  description?: string;
  data?: Record<string, unknown>;
}

export const submitContribution = async (data: ContributionSubmit, token?: string) =>
  apiPost<{ id: string }>('/contributions', data, token);

// ── Payments ──────────────────────────────────────────────────────────────────

export interface CreditPack {
  id: string;
  credits: number;
  priceKes: number;
  priceUsd: number;
  label: string;
  popular?: boolean;
}

export interface PaymentProvider {
  id: string;
  name: string;
  slug: string;
  isEnabled: boolean;
}

export const getCreditPacks = async () =>
  apiGet<{ packs: CreditPack[] }>('/payments/packs');

export const getPaymentProviders = async () =>
  apiGet<{ providers: PaymentProvider[] }>('/payments/providers');

export const initiatePayment = async (
  data: { packId: string; provider: string; phone?: string },
  token: string
) =>
  apiPost<{ paymentId: string; providerRef: string; meta: Record<string, unknown> }>(
    '/payments/initiate', data, token
  );

export const getPaymentStatus = async (id: string, token: string) =>
  apiGet<{ status: string; credits?: number }>(`/payments/${id}/status`, token);

// ── Wallet / Credits ──────────────────────────────────────────────────────────

export interface WalletBalance {
  balance: number;
}

export const getWalletBalance = async (token: string): Promise<WalletBalance> =>
  apiGet<WalletBalance>('/credits/balance', token);

export const getCreditLedger = async (token: string) =>
  apiGet<{
    entries: Array<{
      id: string;
      type: string;
      creditsDelta: number;
      balanceBefore: number;
      balanceAfter: number;
      source: string;
      createdAt: string;
    }>;
  }>('/credits/ledger', token);

// ── NTSA Consent ──────────────────────────────────────────────────────────────

export const recordNtsaConsent = async (
  data: { vin: string; plate: string },
  token: string
) => apiPost<{ id: string }>('/ntsa/consent', data, token);