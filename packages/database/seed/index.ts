// packages/database/seed/index.ts
import { seedVehicles } from './seed_vehicles';
import { seedPlateVinMap } from './seed_plate_vin_map';
import { seedVehicleEvents } from './seed_vehicle_events';
import { seedPaymentProviders } from './seed_payment_providers';
import { seedAdminSettings } from './seed_admin_settings';

async function main() {
  console.log('🌱 Seeding CuliCars database...\n');

  // Order matters: vehicles first (other tables reference VIN)
  await seedVehicles();
  await seedPlateVinMap();
  await seedVehicleEvents();
  await seedPaymentProviders();
  await seedAdminSettings();

  console.log('\n🎉 All seeds complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  });
