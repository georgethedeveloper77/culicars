"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// packages/database/seed/index.ts
const seed_vehicles_1 = require("./seed_vehicles");
const seed_plate_vin_map_1 = require("./seed_plate_vin_map");
const seed_vehicle_events_1 = require("./seed_vehicle_events");
const seed_payment_providers_1 = require("./seed_payment_providers");
const seed_admin_settings_1 = require("./seed_admin_settings");
async function main() {
    console.log('🌱 Seeding CuliCars database...\n');
    // Order matters: vehicles first (other tables reference VIN)
    await (0, seed_vehicles_1.seedVehicles)();
    await (0, seed_plate_vin_map_1.seedPlateVinMap)();
    await (0, seed_vehicle_events_1.seedVehicleEvents)();
    await (0, seed_payment_providers_1.seedPaymentProviders)();
    await (0, seed_admin_settings_1.seedAdminSettings)();
    console.log('\n🎉 All seeds complete!');
}
main()
    .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
});
