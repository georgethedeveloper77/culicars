// packages/database/seed/seed_vehicle_events.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedVehicleEvents() {
  const events = [
    // Toyota Fielder KCA 123A — full lifecycle
    { vin: 'JTDBR32E540012345', eventType: 'MANUFACTURED' as const, eventDate: new Date('2014-03-01'), country: 'JP', source: 'scraper_beforward' as const, metadata: { factory: 'Toyota Aichi' } },
    { vin: 'JTDBR32E540012345', eventType: 'AUCTIONED' as const, eventDate: new Date('2017-06-15'), country: 'JP', source: 'scraper_beforward' as const, metadata: { auctionHouse: 'USS Nagoya', grade: '4' } },
    { vin: 'JTDBR32E540012345', eventType: 'EXPORTED' as const, eventDate: new Date('2017-07-20'), country: 'JP', source: 'scraper_beforward' as const },
    { vin: 'JTDBR32E540012345', eventType: 'IMPORTED' as const, eventDate: new Date('2017-09-10'), country: 'KE', county: 'Mombasa', source: 'kra' as const },
    { vin: 'JTDBR32E540012345', eventType: 'KRA_CLEARED' as const, eventDate: new Date('2017-09-15'), country: 'KE', county: 'Mombasa', source: 'kra' as const },
    { vin: 'JTDBR32E540012345', eventType: 'REGISTERED' as const, eventDate: new Date('2017-10-01'), country: 'KE', county: 'Nairobi', source: 'ntsa_cor' as const, metadata: { plate: 'KCA 123A' } },
    { vin: 'JTDBR32E540012345', eventType: 'INSPECTED' as const, eventDate: new Date('2019-11-20'), country: 'KE', county: 'Nairobi', source: 'ntsa_cor' as const },
    { vin: 'JTDBR32E540012345', eventType: 'SERVICED' as const, eventDate: new Date('2020-03-15'), country: 'KE', county: 'Nairobi', source: 'scraper_autoexpress' as const, metadata: { garage: 'Auto Express Westlands', work: 'Full service + timing belt' } },
    { vin: 'JTDBR32E540012345', eventType: 'LISTED_FOR_SALE' as const, eventDate: new Date('2023-08-01'), country: 'KE', county: 'Nairobi', source: 'scraper_jiji' as const, metadata: { price: 1250000, currency: 'KES' } },

    // Nissan Note KCB 456B
    { vin: 'JN1TBNT30Z0000123', eventType: 'MANUFACTURED' as const, eventDate: new Date('2015-01-01'), country: 'JP', source: 'scraper_beforward' as const },
    { vin: 'JN1TBNT30Z0000123', eventType: 'IMPORTED' as const, eventDate: new Date('2018-05-10'), country: 'KE', county: 'Mombasa', source: 'kra' as const },
    { vin: 'JN1TBNT30Z0000123', eventType: 'REGISTERED' as const, eventDate: new Date('2018-06-01'), country: 'KE', county: 'Nairobi', source: 'ntsa_cor' as const },

    // Toyota Probox KBZ 789C — PSV history
    { vin: 'JTDBR32E540067890', eventType: 'MANUFACTURED' as const, eventDate: new Date('2013-06-01'), country: 'JP', source: 'scraper_beforward' as const },
    { vin: 'JTDBR32E540067890', eventType: 'IMPORTED' as const, eventDate: new Date('2016-08-10'), country: 'KE', county: 'Mombasa', source: 'kra' as const },
    { vin: 'JTDBR32E540067890', eventType: 'PSV_LICENSED' as const, eventDate: new Date('2017-01-15'), country: 'KE', county: 'Nairobi', source: 'ntsa_cor' as const },

    // Subaru Forester KCC 234D — damage history
    { vin: 'JF1SJ5LC5DG123456', eventType: 'MANUFACTURED' as const, eventDate: new Date('2013-04-01'), country: 'JP', source: 'scraper_beforward' as const },
    { vin: 'JF1SJ5LC5DG123456', eventType: 'IMPORTED' as const, eventDate: new Date('2017-03-10'), country: 'KE', county: 'Mombasa', source: 'kra' as const },
    { vin: 'JF1SJ5LC5DG123456', eventType: 'DAMAGED' as const, eventDate: new Date('2020-11-20'), country: 'KE', county: 'Kiambu', source: 'contribution' as const, metadata: { severity: 'minor', location: 'Front bumper', cause: 'Collision' } },
    { vin: 'JF1SJ5LC5DG123456', eventType: 'REPAIRED' as const, eventDate: new Date('2020-12-05'), country: 'KE', county: 'Nairobi', source: 'scraper_autoexpress' as const },
  ];

  for (const e of events) {
    await prisma.vehicleEvent.create({ data: e });
  }

  console.log(`✅ Seeded ${events.length} vehicle events`);
}
