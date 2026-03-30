// apps/api/src/processors/rawDataProcessor.ts

import { NormalisedRecord, MergedVehicleRecord, ResultState } from '../types/result.types';
import { getEnabledAdapters } from '../services/scrapers/adapterRegistry';

const log = (msg: string, data?: Record<string, unknown>) =>
  console.log(JSON.stringify({ msg, ...data }));

const MERGEABLE_FIELDS = [
  'vin', 'plate', 'make', 'model', 'year',
  'engineCapacity', 'fuelType', 'color', 'bodyType',
  'transmissionType', 'registrationDate', 'importDate',
  'mileage', 'mileageUnit', 'auctionGrade',
] as const;

type MergeableField = typeof MERGEABLE_FIELDS[number];

const IDENTITY_FIELDS: MergeableField[] = ['make', 'model', 'year'];

function deriveResultState(merged: MergedVehicleRecord, records: NormalisedRecord[]): ResultState {
  const hasIdentity = IDENTITY_FIELDS.every((f) => (merged as any)[f] != null);
  const maxConfidence = records.reduce((m, r) => Math.max(m, r.confidence), 0);

  if (!hasIdentity && records.length === 0) return 'pending_enrichment';
  if (!hasIdentity) return 'low_confidence';
  if (maxConfidence >= 0.85) return 'verified';
  return 'partial';
}

function mergeRecords(records: NormalisedRecord[]): MergedVehicleRecord {
  const sorted = [...records].sort((a, b) => a.confidence - b.confidence);

  const mergedFields: Partial<Record<MergeableField, unknown>> = {};
  const fieldSources: Record<string, string> = {};
  const sources = records.map((r) => r.sourceName);

  for (const record of sorted) {
    for (const field of MERGEABLE_FIELDS) {
      const value = (record as any)[field];
      if (value == null) continue;

      if (field === 'auctionGrade' && record.sourceName !== 'be_forward') {
        if (fieldSources[field] === 'be_forward') continue;
      }

      mergedFields[field] = value;
      fieldSources[field] = record.sourceName;
    }
  }

  const maxConfidence = records.reduce((m, r) => Math.max(m, r.confidence), 0);

  return {
    vin:              (mergedFields.vin              as string)       ?? null,
    plate:            (mergedFields.plate            as string)       ?? null,
    make:             (mergedFields.make             as string)       ?? null,
    model:            (mergedFields.model            as string)       ?? null,
    year:             (mergedFields.year             as number)       ?? null,
    engineCapacity:   (mergedFields.engineCapacity   as string)       ?? null,
    fuel_type:         (mergedFields.fuelType         as string)       ?? null,
    color:            (mergedFields.color            as string)       ?? null,
    body_type:         (mergedFields.bodyType         as string)       ?? null,
    transmissionType: (mergedFields.transmissionType as string)       ?? null,
    registrationDate: (mergedFields.registrationDate as string)       ?? null,
    importDate:       (mergedFields.importDate       as string)       ?? null,
    mileage:          (mergedFields.mileage          as number)       ?? null,
    mileageUnit:      (mergedFields.mileageUnit      as 'km' | 'mi') ?? null,
    auctionGrade:     (mergedFields.auctionGrade     as string)       ?? null,
    resultState: 'pending_enrichment',
    confidence: maxConfidence,
    sources,
    fieldSources,
  };
}

export interface ProcessorInput {
  vin?: string | null;
  plate?: string | null;
}

export interface ProcessorResult {
  merged: MergedVehicleRecord;
  records: NormalisedRecord[];
  shouldQueue: boolean;
}

export async function processVehicleQuery(input: ProcessorInput): Promise<ProcessorResult> {
  const { vin, plate } = input;

  if (!vin && !plate) {
    throw new Error('processVehicleQuery: must supply vin or plate');
  }

  const adapters = getEnabledAdapters();
  const records: NormalisedRecord[] = [];

  await Promise.allSettled(
    adapters.map(async (adapter) => {
      try {
        let record: NormalisedRecord | null = null;
        if (vin)              record = await adapter.fetchByVin(vin);
        if (!record && plate) record = await adapter.fetchByPlate(plate);
        if (record) records.push(record);
      } catch (err) {
        log('Adapter threw unexpectedly — skipped', { adapter: adapter.sourceName, err: String(err) });
      }
    }),
  );

  const merged = mergeRecords(records);
  merged.resultState = deriveResultState(merged, records);

  const shouldQueue =
    merged.resultState === 'pending_enrichment' ||
    merged.resultState === 'low_confidence';

  log('rawDataProcessor: query complete', {
    vin: vin ?? undefined,
    plate: plate ?? undefined,
    state: merged.resultState,
    sources: merged.sources,
    shouldQueue,
  });

  return { merged, records, shouldQueue };
}



// ─── Original processJobRawData (restored) ───────────────────────────────────
import prismaClient from '../lib/prisma';
import { processListing }       from './listingProcessor';
import { processAuction }       from './auctionProcessor';
import { processServiceRecord } from './serviceRecordProcessor';
import { normalizeVin }         from './vinNormalizer';

const LISTING_SOURCES = ['JIJI', 'PIGIAME', 'OLX', 'AUTOCHEK', 'AUTOSKENYA', 'KABA', 'GARAM', 'MOGO', 'CAR_DUKA', 'KRA_IBID'];
const AUCTION_SOURCES = ['BEFORWARD'];
const SERVICE_SOURCES = ['AUTO_EXPRESS'];

export interface JobProcessResult {
  processed: number;
  inserted:  number;
  skipped:   number;
  errors:    number;
}

export async function processJobRawData(jobId: string): Promise<JobProcessResult> {
  const rows = await prismaClient.scraper_data_raw.findMany({
    where: { job_id: jobId, processed: false },
  });

  let inserted = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const row of rows) {
    let wasInserted = false;

    try {
      const source = row.source as string;
      const data   = row.raw_data as Record<string, unknown>;

      if (row.vin == null && data?.vin) {
        (row as Record<string, unknown>).vin = normalizeVin(data.vin as string);
      }

      if (LISTING_SOURCES.includes(source)) {
        wasInserted = await processListing(row as never, row.vin ?? null);
      } else if (AUCTION_SOURCES.includes(source)) {
        wasInserted = await processAuction(row as never, row.vin ?? null);
      } else if (SERVICE_SOURCES.includes(source)) {
        wasInserted = await processServiceRecord(row as never, row.vin ?? null);
      }

      if (wasInserted) inserted++; else skipped++;
    } catch {
      errors++;
    }

    await prismaClient.scraper_data_raw.update({
      where: { id: row.id },
      data:  { processed: true, processed_at: new Date() },
    });
  }

  return { processed: rows.length, inserted, skipped, errors };
}
