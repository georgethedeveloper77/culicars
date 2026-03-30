// ============================================================
// CuliCars — Section Builder: IMPORT (LOCKED)
// Origin country + Japan auction data + KRA clearance
// ============================================================

import prisma from '../../lib/prisma';
import type { ImportSectionData } from '../../types/report.types';

export async function buildImportSection(vin: string): Promise<{
  data: ImportSectionData;
  record_count: number;
  data_status: 'found' | 'not_found' | 'not_checked';
}> {
  const [vehicle, importEvents] = await Promise.all([
    prisma.vehicles.findUnique({
      where: { vin },
      select: {
        country_of_origin: true,
        import_country: true,
        is_imported: true,
        japan_auction_grade: true,
        japan_auction_mileage: true,
        kra_pin: true,
      },
    }),

    prisma.vehicle_events.findMany({
      where: {
        vin,
        event_type: { in: ['IMPORTED', 'KRA_CLEARED', 'AUCTIONED', 'EXPORTED'] },
      },
      select: {
        event_type: true,
        event_date: true,
        source: true,
        metadata: true,
      },
      orderBy: { event_date: 'asc' },
    }),
  ]);

  if (!vehicle) {
    return {
      data: {
        originCountry: null,
        import_country: null,
        is_imported: false,
        japanAuction: null,
        kraDetails: { clearanceStatus: null, importDate: null, kra_pin: null },
        beForwardData: null,
      },
      record_count: 0,
      data_status: 'not_found',
    };
  }

  // KRA details from events
  const kraEvent = importEvents.find((e) => e.event_type === 'KRA_CLEARED');
  const importEvent = importEvents.find((e) => e.event_type === 'IMPORTED');

  // Japan auction data from events
  const auctionEvent = importEvents.find((e) => e.event_type === 'AUCTIONED');
  const auctionMeta = auctionEvent?.metadata as Record<string, unknown> | null;

  // BE FORWARD data from scraper
  const beForwardEvent = importEvents.find(
    (e) => e.source === 'scraper_beforward'
  );
  const beForwardMeta = beForwardEvent?.metadata as Record<string, unknown> | null;

  const data: ImportSectionData = {
    originCountry: vehicle.country_of_origin,
    import_country: vehicle.import_country,
    is_imported: vehicle.is_imported ?? false,
    japanAuction:
      vehicle.import_country === 'JP' || vehicle.country_of_origin === 'JP'
        ? {
            grade: vehicle.japan_auction_grade,
            mileageAtExport: vehicle.japan_auction_mileage,
            auctionHouse: (auctionMeta?.auctionHouse as string) || null,
            damageMap: (auctionMeta?.damageMap as string) || null,
          }
        : null,
    kraDetails: {
      clearanceStatus: kraEvent ? 'cleared' : null,
      importDate: importEvent
        ? importEvent.event_date.toISOString().split('T')[0]
        : null,
      kra_pin: vehicle.kra_pin,
    },
    beForwardData: beForwardMeta || null,
  };

  const record_count = importEvents.length + (vehicle.is_imported ? 1 : 0);

  return {
    data,
    record_count,
    data_status: record_count > 0 || vehicle.is_imported ? 'found' : 'not_found',
  };
}
