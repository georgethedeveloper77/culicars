// apps/api/src/types/search.types.ts

export type SearchType = 'auto' | 'plate' | 'vin';

export interface SearchRequest {
  q: string;
  type?: SearchType;
}

export interface SearchCandidate {
  vin: string;
  plate: string | null;
  plate_display: string | null;
  confidence: number;
  vehicle: VehicleSummary | null;
  report_id: string | null;
  reportStatus: string | null;
}

export interface VehicleSummary {
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  engine_cc: number | null;
  fuel_type: string | null;
  transmission: string | null;
  body_type: string | null;
  color: string | null;
  country_of_origin: string | null;
  import_country: string | null;
  japan_auction_grade: string | null;
  inspection_status: string | null;
  ntsa_cor_verified: boolean;
}

export interface StolenAlert {
  active: boolean;
  reportCount: number;
  reports: StolenAlertReport[];
}

export interface StolenAlertReport {
  id: string;
  plate: string;
  plate_display: string | null;
  date_stolen: string;
  county_stolen: string;
  police_ob_number: string | null;
  is_ob_verified: boolean;
  car_color: string | null;
  status: string;
  created_at: string;
}

export interface SearchResponse {
  query: string;
  queryType: 'plate' | 'vin' | 'unknown';
  normalizedQuery: string;
  candidates: SearchCandidate[];
  stolenAlert: StolenAlert;
  suggestions?: string[];
}
