"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedVehicleEvents = seedVehicleEvents;
// packages/database/seed/seed_vehicle_events.ts
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedVehicleEvents() {
    const events = [
        // Toyota Fielder KCA 123A — full lifecycle
        { vin: 'JTDBR32E540012345', eventType: 'MANUFACTURED', eventDate: new Date('2014-03-01'), country: 'JP', source: 'scraper_beforward', metadata: { factory: 'Toyota Aichi' } },
        { vin: 'JTDBR32E540012345', eventType: 'AUCTIONED', eventDate: new Date('2017-06-15'), country: 'JP', source: 'scraper_beforward', metadata: { auctionHouse: 'USS Nagoya', grade: '4' } },
        { vin: 'JTDBR32E540012345', eventType: 'EXPORTED', eventDate: new Date('2017-07-20'), country: 'JP', source: 'scraper_beforward' },
        { vin: 'JTDBR32E540012345', eventType: 'IMPORTED', eventDate: new Date('2017-09-10'), country: 'KE', county: 'Mombasa', source: 'kra' },
        { vin: 'JTDBR32E540012345', eventType: 'KRA_CLEARED', eventDate: new Date('2017-09-15'), country: 'KE', county: 'Mombasa', source: 'kra' },
        { vin: 'JTDBR32E540012345', eventType: 'REGISTERED', eventDate: new Date('2017-10-01'), country: 'KE', county: 'Nairobi', source: 'ntsa_cor', metadata: { plate: 'KCA 123A' } },
        { vin: 'JTDBR32E540012345', eventType: 'INSPECTED', eventDate: new Date('2019-11-20'), country: 'KE', county: 'Nairobi', source: 'ntsa_cor' },
        { vin: 'JTDBR32E540012345', eventType: 'SERVICED', eventDate: new Date('2020-03-15'), country: 'KE', county: 'Nairobi', source: 'scraper_autoexpress', metadata: { garage: 'Auto Express Westlands', work: 'Full service + timing belt' } },
        { vin: 'JTDBR32E540012345', eventType: 'LISTED_FOR_SALE', eventDate: new Date('2023-08-01'), country: 'KE', county: 'Nairobi', source: 'scraper_jiji', metadata: { price: 1250000, currency: 'KES' } },
        // Nissan Note KCB 456B
        { vin: 'JN1TBNT30Z0000123', eventType: 'MANUFACTURED', eventDate: new Date('2015-01-01'), country: 'JP', source: 'scraper_beforward' },
        { vin: 'JN1TBNT30Z0000123', eventType: 'IMPORTED', eventDate: new Date('2018-05-10'), country: 'KE', county: 'Mombasa', source: 'kra' },
        { vin: 'JN1TBNT30Z0000123', eventType: 'REGISTERED', eventDate: new Date('2018-06-01'), country: 'KE', county: 'Nairobi', source: 'ntsa_cor' },
        // Toyota Probox KBZ 789C — PSV history
        { vin: 'JTDBR32E540067890', eventType: 'MANUFACTURED', eventDate: new Date('2013-06-01'), country: 'JP', source: 'scraper_beforward' },
        { vin: 'JTDBR32E540067890', eventType: 'IMPORTED', eventDate: new Date('2016-08-10'), country: 'KE', county: 'Mombasa', source: 'kra' },
        { vin: 'JTDBR32E540067890', eventType: 'PSV_LICENSED', eventDate: new Date('2017-01-15'), country: 'KE', county: 'Nairobi', source: 'ntsa_cor' },
        // Subaru Forester KCC 234D — damage history
        { vin: 'JF1SJ5LC5DG123456', eventType: 'MANUFACTURED', eventDate: new Date('2013-04-01'), country: 'JP', source: 'scraper_beforward' },
        { vin: 'JF1SJ5LC5DG123456', eventType: 'IMPORTED', eventDate: new Date('2017-03-10'), country: 'KE', county: 'Mombasa', source: 'kra' },
        { vin: 'JF1SJ5LC5DG123456', eventType: 'DAMAGED', eventDate: new Date('2020-11-20'), country: 'KE', county: 'Kiambu', source: 'contribution', metadata: { severity: 'minor', location: 'Front bumper', cause: 'Collision' } },
        { vin: 'JF1SJ5LC5DG123456', eventType: 'REPAIRED', eventDate: new Date('2020-12-05'), country: 'KE', county: 'Nairobi', source: 'scraper_autoexpress' },
    ];
    for (const e of events) {
        await prisma.vehicleEvent.create({ data: e });
    }
    console.log(`✅ Seeded ${events.length} vehicle events`);
}
