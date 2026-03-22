// apps/api/src/processors/rawDataProcessor.ts
import prisma from '../lib/prisma';
import { normalizeVin } from './vinNormalizer';
import { processServiceRecord } from './serviceRecordProcessor';
import { processListing } from './listingProcessor';
import { processAuction } from './auctionProcessor';

const LISTING_SOURCES = new Set(['JIJI', 'PIGIAME', 'OLX', 'AUTOCHEK', 'AUTOSKENYA', 'KABA']);
const AUCTION_SOURCES = new Set(['KRA_IBID', 'GARAM', 'MOGO', 'CAR_DUKA', 'BEFORWARD']);
const SERVICE_SOURCES = new Set(['AUTO_EXPRESS']);

export interface ProcessorResult {
  processed: number;
  inserted: number;
  skipped: number;
  errors: number;
}

/**
 * Processes all unprocessed rows for a given job.
 * Routes each row to the correct sub-processor based on source.
 * Marks rows as processed=true after handling (success or error).
 */
export async function processJobRawData(jobId: string): Promise<ProcessorResult> {
  const result: ProcessorResult = { processed: 0, inserted: 0, skipped: 0, errors: 0 };

  const batch = await prisma.scraper_data_raw.findMany({
    where: { job_id: jobId, processed: false },
    orderBy: { created_at: 'asc' },
  });

  for (const row of batch) {
    try {
      const raw = row.raw_data as Record<string, unknown>;
      const resolvedVin = normalizeVin(row.vin ?? (raw.vin as string));
      const source = (row.source as string).toUpperCase();

      let wasInserted = false;

      if (SERVICE_SOURCES.has(source)) {
        wasInserted = await processServiceRecord(raw as never, resolvedVin);
      } else if (LISTING_SOURCES.has(source)) {
        wasInserted = await processListing({ ...raw, source } as never, resolvedVin);
      } else if (AUCTION_SOURCES.has(source)) {
        wasInserted = await processAuction({ ...raw, source } as never, resolvedVin);
      } else {
        // Unknown source — mark processed but skip
        wasInserted = false;
      }

      if (wasInserted) {
        result.inserted++;
      } else {
        result.skipped++;
      }

      // Mark as processed regardless of outcome
      await prisma.scraper_data_raw.update({
        where: { id: row.id },
        data: { processed: true, processed_at: new Date() },
      });

      result.processed++;
    } catch (err) {
      result.errors++;
      console.error(`[rawDataProcessor] Error processing row ${row.id}:`, err);

      // Still mark as processed to avoid infinite retry loops
      await prisma.scraper_data_raw.update({
        where: { id: row.id },
        data: { processed: true, processed_at: new Date() },
      }).catch(() => {/* ignore secondary error */});
    }
  }

  return result;
}

/**
 * Processes all unprocessed raw data across all jobs.
 * Used by scheduled tasks or admin triggers.
 */
export async function processAllPending(): Promise<ProcessorResult> {
  const result: ProcessorResult = { processed: 0, inserted: 0, skipped: 0, errors: 0 };

  const pendingJobs = await prisma.scraper_data_raw
    .groupBy({ by: ['job_id'], where: { processed: false } });

  for (const { job_id } of pendingJobs) {
    const jobResult = await processJobRawData(job_id);
    result.processed += jobResult.processed;
    result.inserted += jobResult.inserted;
    result.skipped += jobResult.skipped;
    result.errors += jobResult.errors;
  }

  return result;
}
