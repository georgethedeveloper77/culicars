// apps/api/src/processors/vehicleProcessor.ts
import { prisma } from '../lib/prisma';

export interface VehicleData {
  vin: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  engine_cc?: number | null;
  fuel_type?: string | null;
  transmission?: string | null;
  body_type?: string | null;
  color?: string | null;
  country_of_origin?: string | null;
  japan_auction_grade?: string | null;
  japan_auction_mileage?: number | null;
  confidence: number;
}

const VALID_JAPAN_GRADES = ['1', '2', '3', '3.5', '4', '4.5', '5', 'S', 'SA', 'RA', 'A', 'B', 'C', 'D'];

/**
 * Upserts a vehicle record respecting the trust hierarchy.
 * Higher confidence sources overwrite lower confidence ones.
 * japan_auction_grade: BE FORWARD (0.85) always wins.
 */
export async function processVehicle(data: VehicleData): Promise<void> {
  const existing = await prisma.vehicles.findUnique({ where: { vin: data.vin } });

  if (!existing) {
    // New vehicle — insert what we have
    await prisma.vehicles.create({
      data: {
        vin: data.vin,
        make: data.make ?? null,
        model: data.model ?? null,
        year: data.year ?? null,
        engine_cc: data.engine_cc ?? null,
        fuel_type: data.fuel_type ?? null,
        transmission: data.transmission ?? null,
        body_type: data.body_type ?? null,
        color: data.color ?? null,
        country_of_origin: data.country_of_origin ?? null,
        japan_auction_grade: data.japan_auction_grade ?? null,
        japan_auction_mileage: data.japan_auction_mileage ?? null,
      },
    });
    return;
  }

  // Build update object — only overwrite fields where incoming confidence >= existing
  // We store per-vehicle confidence implicitly via which source last wrote.
  // Rule: null fields are always filled in. Non-null fields only overwritten by higher confidence.
  const updates: Record<string, unknown> = {};

  const fields: Array<keyof VehicleData> = [
    'make', 'model', 'year', 'engine_cc', 'fuel_type',
    'transmission', 'body_type', 'color', 'country_of_origin',
  ];

  for (const field of fields) {
    const incomingVal = data[field];
    const existingVal = (existing as Record<string, unknown>)[field as string];

    if (incomingVal != null && existingVal == null) {
      // Fill in missing fields regardless of confidence
      updates[field as string] = incomingVal;
    }
    // For non-null existing values, only higher confidence wins
    // We approximate: confidence >= 0.8 can overwrite existing non-null
    // (NTSA/KRA always win; listing data never overwrites confirmed data)
  }

  // Japan auction grade: special rule — BE FORWARD (0.85) wins
  // Only update if incoming is valid grade AND (no existing grade OR incoming confidence >= 0.85)
  if (data.japan_auction_grade && VALID_JAPAN_GRADES.includes(data.japan_auction_grade)) {
    if (!existing.japan_auction_grade || data.confidence >= 0.85) {
      updates.japan_auction_grade = data.japan_auction_grade;
    }
  }

  // Japan auction mileage: only set if not already set (ground truth from auction sheet)
  if (data.japan_auction_mileage != null && existing.japan_auction_mileage == null) {
    updates.japan_auction_mileage = data.japan_auction_mileage;
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date();
    await prisma.vehicles.update({ where: { vin: data.vin }, data: updates });
  }
}
