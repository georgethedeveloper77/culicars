// apps/api/src/processors/auctionProcessor.ts
import { insertEvent } from './eventProcessor';
import { processVehicle, VehicleData } from './vehicleProcessor';
import { normalizeVin } from './vinNormalizer';

export interface AuctionRaw {
  source: string;
  vin?: string | null;
  chassis_number?: string | null;
  lot_number?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  mileage_text?: string | null;
  mileage_km_at_export?: number | null;
  price_text?: string | null;
  reserve_price_text?: string | null;
  price_usd?: string | null;
  auction_date?: string | null;
  port?: string | null;
  bank_name?: string | null;
  condition?: string | null;
  damage_description?: string | null;
  damage_locations?: string[];
  japan_auction_grade?: string | null;
  engine_cc?: number | null;
  color?: string | null;
  transmission?: string | null;
  image_urls?: string[];
  primary_image?: string | null;
  has_damage?: boolean;
  confidence?: number;
  scraped_at?: string | null;
}

const SOURCE_MAP: Record<string, string> = {
  KRA_IBID: 'scraper_kra_ibid',
  GARAM: 'scraper_auction',
  MOGO: 'scraper_auction',
  CAR_DUKA: 'scraper_auction',
  BEFORWARD: 'scraper_beforward',
};

function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw.replace(/\//g, '-'));
  return isNaN(d.getTime()) ? null : d;
}

function parseMileage(raw: AuctionRaw): number | null {
  if (raw.mileage_km_at_export != null) return raw.mileage_km_at_export;
  if (!raw.mileage_text) return null;
  const n = parseInt(raw.mileage_text.replace(/,/g, ''), 10);
  return isNaN(n) ? null : n;
}

/**
 * Processes auction data into AUCTIONED vehicle_events.
 * Also upserts vehicle with auction-sourced data including japan_auction_grade.
 * Damage events created separately if has_damage=true.
 */
export async function processAuction(
  raw: AuctionRaw,
  resolvedVin: string | null
): Promise<boolean> {
  const vin = resolvedVin ?? normalizeVin(raw.vin);
  if (!vin) return false;

  const confidence = raw.confidence ?? 0.75;
  const eventSource = SOURCE_MAP[raw.source] ?? `scraper_${raw.source.toLowerCase()}`;
  const auction_date = parseDate(raw.auction_date) ?? new Date();
  const mileage_km = parseMileage(raw);

  // Upsert vehicle — BE FORWARD grade wins (0.85 > 0.75)
  const vehicleData: VehicleData = {
    vin,
    make: raw.make ?? null,
    model: raw.model ?? null,
    year: raw.year ?? null,
    engine_cc: raw.engine_cc ?? null,
    transmission: raw.transmission ?? null,
    color: raw.color ?? null,
    japan_auction_grade: raw.japan_auction_grade ?? null,
    japan_auction_mileage: raw.source === 'BEFORWARD' ? (mileage_km ?? null) : null,
    confidence,
  };
  await processVehicle(vehicleData);

  // Insert AUCTIONED event
  const inserted = await insertEvent({
    vin,
    eventType: 'AUCTIONED',
    eventDate: auction_date,
    country: raw.source === 'BEFORWARD' ? 'JP' : 'KE',
    county: raw.port ?? null,
    source: eventSource,
    source_ref: raw.lot_number ?? null,
    confidence,
    metadata: {
      lot_number: raw.lot_number,
      make: raw.make,
      model: raw.model,
      year: raw.year,
      mileage_km,
      japan_auction_grade: raw.japan_auction_grade,
      port: raw.port,
      bank_name: raw.bank_name,
      condition: raw.condition,
      damage_description: raw.damage_description,
      damage_locations: raw.damage_locations ?? [],
      image_urls: raw.image_urls ?? (raw.primary_image ? [raw.primary_image] : []),
      price_usd: raw.price_usd,
      reserve_price_text: raw.reserve_price_text,
    },
  });

  // If damage present, also insert a DAMAGED event
  if (raw.has_damage && raw.damage_description) {
    await insertEvent({
      vin,
      eventType: 'DAMAGED',
      eventDate: auction_date,
      country: raw.source === 'BEFORWARD' ? 'JP' : 'KE',
      source: eventSource,
      source_ref: raw.lot_number ? `dmg_${raw.lot_number}` : null,
      confidence,
      metadata: {
        description: raw.damage_description,
        damage_locations: raw.damage_locations ?? [],
        source_type: 'auction_sheet',
      },
    });
  }

  return inserted;
}
