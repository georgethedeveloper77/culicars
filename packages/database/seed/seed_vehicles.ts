// packages/database/seed/seed_vehicles.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedVehicles() {
  const vehicles = [
    { vin: 'JTDBR32E540012345', make: 'Toyota', model: 'Fielder', year: 2014, engineCc: 1500, fuelType: 'Petrol', transmission: 'CVT', bodyType: 'Wagon', color: 'Silver', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '4', japanAuctionMileage: 67000, inspectionStatus: 'passed' as const },
    { vin: 'JN1TBNT30Z0000123', make: 'Nissan', model: 'Note', year: 2015, engineCc: 1200, fuelType: 'Petrol', transmission: 'CVT', bodyType: 'Hatchback', color: 'White', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '4', japanAuctionMileage: 45000, inspectionStatus: 'passed' as const },
    { vin: 'JTDBR32E540067890', make: 'Toyota', model: 'Probox', year: 2013, engineCc: 1500, fuelType: 'Petrol', transmission: 'Automatic', bodyType: 'Wagon', color: 'White', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '3.5', japanAuctionMileage: 89000, inspectionStatus: 'passed' as const },
    { vin: 'JF1SJ5LC5DG123456', make: 'Subaru', model: 'Forester', year: 2013, engineCc: 2000, fuelType: 'Petrol', transmission: 'Automatic', bodyType: 'SUV', color: 'Blue', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '4', japanAuctionMileage: 72000, inspectionStatus: 'passed' as const },
    { vin: 'JHMGE8H59DC012345', make: 'Honda', model: 'Fit', year: 2013, engineCc: 1300, fuelType: 'Petrol', transmission: 'CVT', bodyType: 'Hatchback', color: 'Red', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '4.5', japanAuctionMileage: 38000, inspectionStatus: 'passed' as const },
    { vin: 'JMZ6GG1R2D0123456', make: 'Mazda', model: 'Demio', year: 2013, engineCc: 1300, fuelType: 'Petrol', transmission: 'Automatic', bodyType: 'Hatchback', color: 'Black', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '3.5', inspectionStatus: 'passed' as const },
    { vin: 'JTDKN3DU5A0012345', make: 'Toyota', model: 'Premio', year: 2010, engineCc: 1800, fuelType: 'Petrol', transmission: 'CVT', bodyType: 'Sedan', color: 'Silver', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '4', japanAuctionMileage: 95000, inspectionStatus: 'expired' as const },
    { vin: 'JA4AZ3A38EZ012345', make: 'Mitsubishi', model: 'Outlander', year: 2014, engineCc: 2400, fuelType: 'Petrol', transmission: 'CVT', bodyType: 'SUV', color: 'Grey', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '4', inspectionStatus: 'passed' as const },
    { vin: 'WBA3A5C55FK123456', make: 'BMW', model: '320i', year: 2015, engineCc: 2000, fuelType: 'Petrol', transmission: 'Automatic', bodyType: 'Sedan', color: 'Black', countryOfOrigin: 'DE', importCountry: 'GB', isImported: true, inspectionStatus: 'passed' as const },
    { vin: 'JTDBR32E540099999', make: 'Toyota', model: 'Vitz', year: 2012, engineCc: 1000, fuelType: 'Petrol', transmission: 'CVT', bodyType: 'Hatchback', color: 'Green', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '3', japanAuctionMileage: 105000, inspectionStatus: 'passed' as const },
    { vin: 'JN1TANT31U0012345', make: 'Nissan', model: 'X-Trail', year: 2014, engineCc: 2000, fuelType: 'Petrol', transmission: 'CVT', bodyType: 'SUV', color: 'White', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '4', inspectionStatus: 'passed' as const },
    { vin: 'JTDKN3DU8C0045678', make: 'Toyota', model: 'Allion', year: 2012, engineCc: 1800, fuelType: 'Petrol', transmission: 'CVT', bodyType: 'Sedan', color: 'Dark Blue', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '3.5', inspectionStatus: 'passed' as const },
    { vin: 'JF2SJAEC4DH012345', make: 'Subaru', model: 'Impreza', year: 2013, engineCc: 2000, fuelType: 'Petrol', transmission: 'Manual', bodyType: 'Sedan', color: 'White', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '4', inspectionStatus: 'passed' as const },
    { vin: 'JTEBU5JR5D5012345', make: 'Toyota', model: 'Prado', year: 2013, engineCc: 2700, fuelType: 'Petrol', transmission: 'Automatic', bodyType: 'SUV', color: 'Pearl White', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '4.5', inspectionStatus: 'passed' as const },
    { vin: 'WDD2040462A012345', make: 'Mercedes-Benz', model: 'C200', year: 2014, engineCc: 2000, fuelType: 'Petrol', transmission: 'Automatic', bodyType: 'Sedan', color: 'Silver', countryOfOrigin: 'DE', importCountry: 'GB', isImported: true, inspectionStatus: 'passed' as const },
    { vin: 'KMH123456789ABCDE', make: 'Hyundai', model: 'Tucson', year: 2016, engineCc: 2000, fuelType: 'Petrol', transmission: 'Automatic', bodyType: 'SUV', color: 'Brown', countryOfOrigin: 'KR', importCountry: 'KR', isImported: true, inspectionStatus: 'passed' as const },
    { vin: 'JAANP81E1YZ012345', make: 'Isuzu', model: 'D-Max', year: 2015, engineCc: 2500, fuelType: 'Diesel', transmission: 'Manual', bodyType: 'Pickup', color: 'White', countryOfOrigin: 'TH', importCountry: 'TH', isImported: true, inspectionStatus: 'passed' as const },
    { vin: 'JTDBR32E890123456', make: 'Toyota', model: 'Hilux', year: 2016, engineCc: 2400, fuelType: 'Diesel', transmission: 'Manual', bodyType: 'Pickup', color: 'Silver', countryOfOrigin: 'TH', importCountry: 'TH', isImported: true, inspectionStatus: 'passed' as const },
    { vin: 'JN1HBNT30Z0098765', make: 'Nissan', model: 'Juke', year: 2014, engineCc: 1600, fuelType: 'Petrol', transmission: 'CVT', bodyType: 'SUV', color: 'Orange', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '4', inspectionStatus: 'passed' as const },
    { vin: 'JHMFC1F34DX012345', make: 'Honda', model: 'Vezel', year: 2014, engineCc: 1500, fuelType: 'Hybrid', transmission: 'CVT', bodyType: 'SUV', color: 'Black', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '4.5', inspectionStatus: 'passed' as const },
    { vin: 'JTDKN3DU1E0078901', make: 'Toyota', model: 'Wish', year: 2014, engineCc: 1800, fuelType: 'Petrol', transmission: 'CVT', bodyType: 'MPV', color: 'Grey', countryOfOrigin: 'JP', importCountry: 'JP', isImported: true, japanAuctionGrade: '4', inspectionStatus: 'passed' as const },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { vin: v.vin },
      update: {},
      create: v,
    });
  }

  console.log(`✅ Seeded ${vehicles.length} vehicles`);
}
