// ============================================================
// CuliCars — Section Builder: IMPORT (LOCKED)
// Origin country + Japan auction data + KRA clearance
// ============================================================

import prisma from '../../lib/prisma';
import type { ImportSectionData } from '../../types/report.types';

export async function buildImportSection(vin: string): Promise<{
  data: ImportSectionData;
  recordCount: number;
  dataStatus: 'found' | 'not_found' | 'not_checked';
}> {
  const [vehicle, importEvents] = await Promise.all([
    prisma.vehicles.findUnique({
      where: { vin },
      select: {
        countryOfOrigin: true,
        importCountry: true,
        isImported: true,
        japanAuctionGrade: true,
        japanAuctionMileage: true,
        kraPin: true,
      },
    }),

    prisma.vehicleEvents.findMany({
      where: {
        vin,
        eventType: { in: ['IMPORTED', 'KRA_CLEARED', 'AUCTIONED', 'EXPORTED'] },
      },
      select: {
        eventType: true,
        eventDate: true,
        source: true,
        metadata: true,
      },
      orderBy: { eventDate: 'asc' },
    }),
  ]);

  if (!vehicle) {
    return {
      data: {
        originCountry: null,
        importCountry: null,
        isImported: false,
        japanAuction: null,
        kraDetails: { clearanceStatus: null, importDate: null, kraPin: null },
        beForwardData: null,
      },
      recordCount: 0,
      dataStatus: 'not_found',
    };
  }

  // KRA details from events
  const kraEvent = importEvents.find((e) => e.eventType === 'KRA_CLEARED');
  const importEvent = importEvents.find((e) => e.eventType === 'IMPORTED');

  // Japan auction data from events
  const auctionEvent = importEvents.find((e) => e.eventType === 'AUCTIONED');
  const auctionMeta = auctionEvent?.metadata as Record<string, unknown> | null;

  // BE FORWARD data from scraper
  const beForwardEvent = importEvents.find(
    (e) => e.source === 'scraper_beforward'
  );
  const beForwardMeta = beForwardEvent?.metadata as Record<string, unknown> | null;

  const data: ImportSectionData = {
    originCountry: vehicle.countryOfOrigin,
    importCountry: vehicle.importCountry,
    isImported: vehicle.isImported ?? false,
    japanAuction:
      vehicle.importCountry === 'JP' || vehicle.countryOfOrigin === 'JP'
        ? {
            grade: vehicle.japanAuctionGrade,
            mileageAtExport: vehicle.japanAuctionMileage,
            auctionHouse: (auctionMeta?.auctionHouse as string) || null,
            damageMap: (auctionMeta?.damageMap as string) || null,
          }
        : null,
    kraDetails: {
      clearanceStatus: kraEvent ? 'cleared' : null,
      importDate: importEvent
        ? importEvent.eventDate.toISOString().split('T')[0]
        : null,
      kraPin: vehicle.kraPin,
    },
    beForwardData: beForwardMeta || null,
  };

  const recordCount = importEvents.length + (vehicle.isImported ? 1 : 0);

  return {
    data,
    recordCount,
    dataStatus: recordCount > 0 || vehicle.isImported ? 'found' : 'not_found',
  };
}
