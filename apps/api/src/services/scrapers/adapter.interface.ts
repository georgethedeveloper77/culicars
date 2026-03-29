// apps/api/src/services/scrapers/adapter.interface.ts

import { NormalisedRecord } from '../../types/result.types';

export interface ScraperAdapter {
  readonly sourceName: string;
  isEnabled(): boolean;
  fetchByVin(vin: string): Promise<NormalisedRecord | null>;
  fetchByPlate(plate: string): Promise<NormalisedRecord | null>;
}
