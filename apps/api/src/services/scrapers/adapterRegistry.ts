// apps/api/src/services/scrapers/adapterRegistry.ts

import { ScraperAdapter } from './adapter.interface';
import { NtsaCorAdapter } from './ntsaCorAdapter';
import { BeForwardAdapter } from './beForwardAdapter';
import { SbtAdapter } from './sbtAdapter';

/**
 * Master list of all vehicle data source adapters.
 * Ordered by confidence descending — highest-confidence sources resolve field conflicts.
 * Add new adapters here; they are automatically picked up by rawDataProcessor.
 */
const ALL_ADAPTERS: ScraperAdapter[] = [
  new NtsaCorAdapter(),   // confidence 1.0
  new BeForwardAdapter(), // confidence 0.85
  new SbtAdapter(),       // confidence 0.80
];

export function getEnabledAdapters(): ScraperAdapter[] {
  return ALL_ADAPTERS.filter((a) => a.isEnabled());
}

export function getAdapterByName(name: string): ScraperAdapter | undefined {
  return ALL_ADAPTERS.find((a) => a.sourceName === name);
}
