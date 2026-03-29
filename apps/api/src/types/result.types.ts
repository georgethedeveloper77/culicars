// apps/api/src/types/result.types.ts

export type ResultState =
  | 'verified'
  | 'partial'
  | 'low_confidence'
  | 'pending_enrichment';

export interface NormalisedRecord {
  vin: string | null;
  plate: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  engineCapacity: string | null;
  fuelType: string | null;
  color: string | null;
  bodyType: string | null;
  transmissionType: string | null;
  registrationDate: string | null;
  importDate: string | null;
  mileage: number | null;
  mileageUnit: 'km' | 'mi' | null;
  auctionGrade: string | null;
  sourceId: string;
  sourceName: string;
  confidence: number;
  fetchedAt: string;
}

export interface MergedVehicleRecord {
  vin: string | null;
  plate: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  engineCapacity: string | null;
  fuelType: string | null;
  color: string | null;
  bodyType: string | null;
  transmissionType: string | null;
  registrationDate: string | null;
  importDate: string | null;
  mileage: number | null;
  mileageUnit: 'km' | 'mi' | null;
  auctionGrade: string | null;
  resultState: ResultState;
  confidence: number;
  sources: string[];
  fieldSources: Record<string, string>;
}
