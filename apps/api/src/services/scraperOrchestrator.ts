// apps/api/src/services/scraperOrchestrator.ts
import { BaseScraper } from './scrapers/baseScraper';
import { createJob, updateJob, completeJob, failJob, ScraperSource, JobTrigger } from './scraperJobService';
import { processJobRawData } from '../processors/rawDataProcessor';

import { JijiScraper } from './scrapers/jijiScraper';
import { PigiaMeScraper } from './scrapers/pigiaMeScraper';
import { OlxScraper } from './scrapers/olxScraper';
import { AutochekScraper } from './scrapers/autochekScraper';
import { AutosKenyaScraper } from './scrapers/autosKenyaScraper';
import { KabaScraper } from './scrapers/kabaScraper';
import { AutoExpressScraper } from './scrapers/autoExpressScraper';
import { KraIbidScraper } from './scrapers/kraIbidScraper';
import { GaramScraper } from './scrapers/garamScraper';
import { MogoScraper } from './scrapers/mogoScraper';
import { CarDukaScraper } from './scrapers/carDukaScraper';
import { BeforwardScraper } from './scrapers/beforwardScraper';

type ScraperFactory = () => BaseScraper;

const SCRAPER_REGISTRY = new Map<ScraperSource, ScraperFactory>([
  ['JIJI',        () => new JijiScraper()],
  ['PIGIAME',     () => new PigiaMeScraper()],
  ['OLX',         () => new OlxScraper()],
  ['AUTOCHEK',    () => new AutochekScraper()],
  ['AUTOSKENYA',  () => new AutosKenyaScraper()],
  ['KABA',        () => new KabaScraper()],
  ['AUTO_EXPRESS',() => new AutoExpressScraper()],
  ['KRA_IBID',    () => new KraIbidScraper()],
  ['GARAM',       () => new GaramScraper()],
  ['MOGO',        () => new MogoScraper()],
  ['CAR_DUKA',    () => new CarDukaScraper()],
  ['BEFORWARD',   () => new BeforwardScraper()],
]);

export function registerScraper(source: ScraperSource, factory: ScraperFactory): void {
  SCRAPER_REGISTRY.set(source, factory);
}

export function getRegisteredSources(): ScraperSource[] {
  return Array.from(SCRAPER_REGISTRY.keys());
}

export interface RunResult {
  jobId: string;
  source: ScraperSource;
  items_found: number;
  items_stored: number;
  items_skipped: number;
  processor_inserted: number;
  processor_skipped: number;
  error?: string;
}

/**
 * Runs a single scraper end-to-end:
 * 1. Creates a scraper_jobs record
 * 2. Runs the scraper → RawScrapedItems
 * 3. Saves to scraper_data_raw
 * 4. Triggers rawDataProcessor for this job
 * 5. Updates job record with final counts
 */
export async function runScraper(
  source: ScraperSource,
  trigger: JobTrigger = 'manual'
): Promise<RunResult> {
  const factory = SCRAPER_REGISTRY.get(source);
  if (!factory) {
    throw new Error(`No scraper registered for source: ${source}`);
  }

  const job = await createJob(source, trigger);
  const jobId = job.id;

  try {
    await updateJob(jobId, { status: 'running', startedAt: new Date() });

    const scraper = factory();
    const items = await scraper.scrape();
    const items_found = items.length;

    const items_stored = await scraper.saveRaw(items, jobId);
    const items_skipped = items_found - items_stored;

    // Process the raw data immediately after scraping
    const procResult = await processJobRawData(jobId);

    await completeJob(jobId, { items_found: items_found, items_stored: items_stored, items_skipped: items_skipped });

    return {
      jobId,
      source,
      items_found,
      items_stored,
      items_skipped,
      processor_inserted: procResult.inserted,
      processor_skipped: procResult.skipped,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failJob(jobId, message);
    return {
      jobId,
      source,
      items_found: 0,
      items_stored: 0,
      items_skipped: 0,
      processor_inserted: 0,
      processor_skipped: 0,
      error: message,
    };
  }
}
