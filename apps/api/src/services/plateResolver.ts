// apps/api/src/services/plateResolver.ts
import { prisma } from '../lib/prisma';
import type { SearchCandidate, VehicleSummary } from '../types/search.types';

export async function resolveByPlate(
  normalizedPlate: string,
  limit: number = 5
): Promise<SearchCandidate[]> {
  const mappings = await prisma.plate_vin_map.findMany({
    where: { plate: normalizedPlate },
    orderBy: { confidence: 'desc' },
    take: limit,
    include: {
      vehicles: {
        include: {
          reports: {
            where: { status: { in: ['ready', 'stale'] } },
            orderBy: { generated_at: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  return mappings.map((m) => {
    const v = m.vehicles;
    const report = v?.reports?.[0] ?? null;

    const vehicle = v
      ? {
          vin: v.vin,
          make: v.make,
          model: v.model,
          year: v.year,
          engine_cc: v.engine_cc,
          fuel_type: v.fuel_type,
          transmission: v.transmission,
          body_type: v.body_type,
          color: v.color,
          country_of_origin: v.country_of_origin,
          import_country: v.import_country,
          japan_auction_grade: v.japan_auction_grade,
          inspection_status: v.inspection_status,
          ntsa_cor_verified: v.ntsa_cor_verified ?? false,
        }
      : null;

    return {
      vin: m.vin,
      plate: m.plate,
      plate_display: m.plate_display,
      confidence: m.confidence ?? 0.5,
      vehicle,
      report_id: report?.id ?? null,
      reportStatus: report?.status ?? null,
    };
  });
}

export async function resolveByVin(vin: string): Promise<SearchCandidate[]> {
  const vehicle = await prisma.vehicles.findUnique({
    where: { vin },
    include: {
      plate_vin_map: {
        orderBy: { confidence: 'desc' },
        take: 1,
      },
      reports: {
        where: { status: { in: ['ready', 'stale'] } },
        orderBy: { generated_at: 'desc' },
        take: 1,
      },
    },
  });

  if (!vehicle) return [];

  const bestPlate = vehicle.plate_vin_map[0] ?? null;
  const report = vehicle.reports[0] ?? null;

  return [
    {
      vin: vehicle.vin,
      plate: bestPlate?.plate ?? null,
      plate_display: bestPlate?.plate_display ?? null,
      confidence: bestPlate?.confidence ?? 1.0,
      vehicle: {
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
        import_country: vehicle.import_country,
        japan_auction_grade: vehicle.japan_auction_grade,
        inspection_status: vehicle.inspection_status,
        ntsa_cor_verified: vehicle.ntsa_cor_verified ?? false,
      },
      report_id: report?.id ?? null,
      reportStatus: report?.status ?? null,
    },
  ];
}
