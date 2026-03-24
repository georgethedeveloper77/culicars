// apps/api/src/processors/serviceRecordProcessor.ts
import { insertEvent } from './eventProcessor';
import { normalizePlate } from './plateProcessor';
import { normalizeVin } from './vinNormalizer';

export interface ServiceRecordRaw {
  vin?: string | null;
  plate?: string | null;
  service_date?: string | null;
  mileage_text?: string | null;
  garage_name?: string | null;
  work_done?: string | null;
  record_id?: string | null;
  confidence?: number;
}

function parseMileage(text: string | null | undefined): number | null {
  if (!text) return null;
  const n = parseInt(text.replace(/,/g, ''), 10);
  return isNaN(n) ? null : n;
}

function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const normalized = raw.replace(/\//g, '-');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Processes Auto Express service records into SERVICED vehicle_events.
 * Each service record with mileage also contributes to odometer history.
 */
export async function processServiceRecord(
  raw: ServiceRecordRaw,
  resolvedVin: string | null
): Promise<boolean> {
  const vin = resolvedVin ?? normalizeVin(raw.vin);
  if (!vin) return false;

  const event_date = parseDate(raw.service_date) ?? new Date();
  const mileage_km = parseMileage(raw.mileage_text);
  const confidence = raw.confidence ?? 0.8;

  const metadata: Record<string, unknown> = {
    garage_name: raw.garage_name ?? null,
    work_done: raw.work_done ?? null,
    mileage_km,
    plate: raw.plate ? normalizePlate(raw.plate) : null,
  };

  const inserted = await insertEvent({
    vin,
    eventType: 'SERVICED',
    eventDate: event_date,
    country: 'KE',
    source: 'scraper_autoexpress',
    source_ref: raw.record_id ?? null,
    confidence,
    metadata,
  });

  return inserted;
}
