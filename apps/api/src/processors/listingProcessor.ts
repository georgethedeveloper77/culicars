// apps/api/src/processors/listingProcessor.ts
import { insertEvent } from './eventProcessor';
import { processVehicle, VehicleData } from './vehicleProcessor';
import { processPlate, normalizePlate, formatPlate } from './plateProcessor';
import { normalizeVin } from './vinNormalizer';

export interface ListingRaw {
  source: string;
  listing_id?: string | null;
  title?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  mileage_text?: string | null;
  mileage_km?: number | null;
  price_text?: string | null;
  price_kes?: number | null;
  vin?: string | null;
  plate?: string | null;
  color?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  location?: string | null;
  image_url?: string | null;
  scraped_at?: string | null;
  confidence?: number;
}

const SOURCE_MAP: Record<string, string> = {
  JIJI: 'scraper_jiji',
  PIGIAME: 'scraper_pigiame',
  OLX: 'scraper_olx',
  AUTOCHEK: 'scraper_autochek',
  AUTOSKENYA: 'scraper_autoskenya',
  KABA: 'scraper_kaba',
};

function parseMileage(raw: ListingRaw): number | null {
  if (raw.mileage_km != null) return raw.mileage_km;
  if (!raw.mileage_text) return null;
  const n = parseInt(raw.mileage_text.replace(/,/g, ''), 10);
  return isNaN(n) ? null : n;
}

function extractMakeModel(title: string | null): { make: string | null; model: string | null } {
  if (!title) return { make: null, model: null };
  // Typical format: "2014 Toyota Fielder" or "Toyota Land Cruiser 2018"
  const yearStripped = title.replace(/\b(19|20)\d{2}\b/, '').trim();
  const parts = yearStripped.split(/\s+/);
  return {
    make: parts[0] ?? null,
    model: parts.slice(1).join(' ') || null,
  };
}

/**
 * Processes listing data into LISTED_FOR_SALE vehicle_events.
 * Also upserts vehicle and plate records if sufficient data exists.
 */
export async function processListing(
  raw: ListingRaw,
  resolvedVin: string | null
): Promise<boolean> {
  const vin = resolvedVin ?? normalizeVin(raw.vin);
  if (!vin) return false;

  const confidence = raw.confidence ?? 0.5;
  const eventSource = SOURCE_MAP[raw.source] ?? `scraper_${raw.source.toLowerCase()}`;
  const mileage_km = parseMileage(raw);
  const scrapedDate = raw.scraped_at ? new Date(raw.scraped_at) : new Date();

  // Try to parse make/model from title if not explicit
  const { make: titleMake, model: titleModel } = extractMakeModel(raw.title ?? null);

  // Upsert vehicle with listing data
  const vehicleData: VehicleData = {
    vin,
    make: raw.make ?? titleMake,
    model: raw.model ?? titleModel,
    year: raw.year ?? null,
    fuel_type: raw.fuel_type ?? null,
    transmission: raw.transmission ?? null,
    color: raw.color ?? null,
    confidence,
  };
  await processVehicle(vehicleData);

  // Upsert plate if present
  if (raw.plate) {
    const normalized = normalizePlate(raw.plate);
    await processPlate({
      plate: normalized,
      plateDisplay: formatPlate(normalized),
      vin,
      confidence,
      source: eventSource,
    });
  }

  // Insert LISTED_FOR_SALE event
  const inserted = await insertEvent({
    vin,
    eventType: 'LISTED_FOR_SALE',
    eventDate: scrapedDate,
    country: 'KE',
    source: eventSource,
    source_ref: raw.listing_id ?? null,
    confidence,
    metadata: {
      listing_id: raw.listing_id,
      title: raw.title,
      price_text: raw.price_text,
      price_kes: raw.price_kes,
      mileage_km,
      location: raw.location,
      image_url: raw.image_url,
    },
  });

  return inserted;
}
