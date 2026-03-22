// apps/api/src/types/search.types.ts

export type SearchType = 'auto' | 'plate' | 'vin';

export interface SearchRequest {
  q: string;
  type?: SearchType;
}

export interface SearchCandidate {
  vin: string;
  plate: string | null;
  plateDisplay: string | null;
  confidence: number;
  vehicle: VehicleSummary | null;
  reportId: string | null;
  reportStatus: string | null;
}

export interface VehicleSummary {
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
  importCountry: string | null;
  japanAuctionGrade: string | null;
  inspectionStatus: string | null;
  ntsaCorVerified: boolean;
}

export interface StolenAlert {
  active: boolean;
  reportCount: number;
  reports: StolenAlertReport[];
}

export interface StolenAlertReport {
  id: string;
  plate: string;
  plateDisplay: string | null;
  dateStolen: string;
  countyStolen: string;
  policeObNumber: string | null;
  isObVerified: boolean;
  carColor: string | null;
  status: string;
  createdAt: string;
}

export interface SearchResponse {
  query: string;
  queryType: 'plate' | 'vin' | 'unknown';
  normalizedQuery: string;
  candidates: SearchCandidate[];
  stolenAlert: StolenAlert;
  suggestions?: string[];
}
