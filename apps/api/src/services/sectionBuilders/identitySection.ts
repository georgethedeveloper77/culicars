// ============================================================
// CuliCars — Section Builder: IDENTITY (FREE)
// VIN decode + basic specs + associated plates
// ============================================================

import { prisma } from '../../lib/prisma';
import type { IdentitySectionData } from '../../types/report.types';

export async function buildIdentitySection(vin: string): Promise<{
  data: IdentitySectionData;
  record_count: number;
  data_status: 'found' | 'not_found' | 'not_checked';
}> {
  const [vehicle, plates] = await Promise.all([
    prisma.vehicles.findUnique({
      where: { vin },
      select: {
        vin: true,
        make: true,
        model: true,
        year: true,
        engine_cc: true,
        fuel_type: true,
        transmission: true,
        body_type: true,
        color: true,
        country_of_origin: true,
        chassis_number: true,
        ntsa_cor_verified: true,
      },
    }),
    prisma.plate_vin_map.findMany({
      where: { vin },
      select: {
        plate: true,
        plate_display: true,
        confidence: true,
        source: true,
      },
      orderBy: { confidence: 'desc' },
    }),
  ]);

  if (!vehicle) {
    return {
      data: {
        vin,
        make: null,
        model: null,
        year: null,
        engine_cc: null,
        fuel_type: null,
        transmission: null,
        body_type: null,
        color: null,
        country_of_origin: null,
        chassis_number: null,
        ntsa_cor_verified: false,
        plates: [],
      },
      record_count: 0,
      data_status: 'not_found',
    };
  }

  return {
    data: {
      vin: vehicle.vin,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      engine_cc: vehicle.engine_cc,
      fuel_type: vehicle.fuel_type,
      transmission: vehicle.transmission,
      body_type: vehicle.body_type,
      color: vehicle.color,
      country_of_origin: vehicle.country_of_origin,
      chassis_number: vehicle.chassis_number,
      ntsa_cor_verified: vehicle.ntsa_cor_verified ?? false,
      plates: plates.map((p) => ({
        plate: p.plate,
        plate_display: p.plate_display ?? p.plate,
        confidence: p.confidence ?? 0.5,
        source: p.source ?? 'unknown',
      })),
    },
    record_count: 1 + plates.length,
    data_status: 'found',
  };
}
