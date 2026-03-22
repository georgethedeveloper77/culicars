// apps/api/src/services/plateResolver.ts
import prisma from '../lib/prisma';
import type { SearchCandidate, VehicleSummary } from '../types/search.types';

export async function resolveByPlate(
  normalizedPlate: string,
  limit: number = 5
): Promise<SearchCandidate[]> {
  const mappings = await prisma.plateVinMap.findMany({
    where: { plate: normalizedPlate },
    orderBy: { confidence: 'desc' },
    take: limit,
    include: {
      vehicle: {
        include: {
          reports: {
            where: { status: { in: ['ready', 'stale'] } },
            orderBy: { generatedAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  return mappings.map((m) => {
    const v = m.vehicle;
    const report = v?.reports?.[0] ?? null;

    const vehicle: VehicleSummary | null = v
      ? {
          vin: v.vin,
          make: v.make,
          model: v.model,
          year: v.year,
          engineCc: v.engineCc,
          fuelType: v.fuelType,
          transmission: v.transmission,
          bodyType: v.bodyType,
          color: v.color,
          countryOfOrigin: v.countryOfOrigin,
          importCountry: v.importCountry,
          japanAuctionGrade: v.japanAuctionGrade,
          inspectionStatus: v.inspectionStatus,
          ntsaCorVerified: v.ntsaCorVerified,
        }
      : null;

    return {
      vin: m.vin,
      plate: m.plate,
      plateDisplay: m.plateDisplay,
      confidence: m.confidence ?? 0.5,
      vehicle,
      reportId: report?.id ?? null,
      reportStatus: report?.status ?? null,
    };
  });
}

export async function resolveByVin(vin: string): Promise<SearchCandidate[]> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { vin },
    include: {
      plateVinMaps: {
        orderBy: { confidence: 'desc' },
        take: 1,
      },
      reports: {
        where: { status: { in: ['ready', 'stale'] } },
        orderBy: { generatedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!vehicle) return [];

  const bestPlate = vehicle.plateVinMaps[0] ?? null;
  const report = vehicle.reports[0] ?? null;

  return [
    {
      vin: vehicle.vin,
      plate: bestPlate?.plate ?? null,
      plateDisplay: bestPlate?.plateDisplay ?? null,
      confidence: bestPlate?.confidence ?? 1.0,
      vehicle: {
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        engineCc: vehicle.engineCc,
        fuelType: vehicle.fuelType,
        transmission: vehicle.transmission,
        bodyType: vehicle.bodyType,
        color: vehicle.color,
        countryOfOrigin: vehicle.countryOfOrigin,
        importCountry: vehicle.importCountry,
        japanAuctionGrade: vehicle.japanAuctionGrade,
        inspectionStatus: vehicle.inspectionStatus,
        ntsaCorVerified: vehicle.ntsaCorVerified,
      },
      reportId: report?.id ?? null,
      reportStatus: report?.status ?? null,
    },
  ];
}
