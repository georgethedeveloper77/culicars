// ============================================================
// CuliCars — Section Builder: SPECS_EQUIPMENT (FREE)
// VIN option codes + Japan auction grade + Kenya additions
// ============================================================

import prisma from '../../lib/prisma';
import type { SpecsEquipmentSectionData, VinOptionCode } from '../../types/report.types';

/**
 * Decode VIN to extract option codes.
 * In production, this would call a VIN decode API (NHTSA, DataOne, etc.)
 * For now, we derive what we can from the VIN structure + DB data.
 */
function decodeVinOptions(vin: string, vehicle: Record<string, unknown>): VinOptionCode[] {
  const codes: VinOptionCode[] = [];

  // WMI (World Manufacturer Identifier) — first 3 chars
  const wmi = vin.substring(0, 3);

  // Known Toyota WMIs
  const toyotaWmis: Record<string, string> = {
    JTD: 'Toyota Motor Corporation, Japan',
    JTE: 'Toyota Motor Corporation, Japan',
    JTN: 'Toyota Motor Corporation, Japan',
    '2T1': 'Toyota Motor Manufacturing, Canada',
    '4T1': 'Toyota Motor Manufacturing, Kentucky',
    '5YF': 'Toyota Motor Manufacturing, Mississippi',
  };

  if (toyotaWmis[wmi]) {
    codes.push({
      category: 'Manufacturer',
      code: wmi,
      label: 'Manufacturing Origin',
      value: toyotaWmis[wmi],
    });
  }

  // VDS (Vehicle Descriptor Section) — chars 4-8
  const modelCode = vin.substring(3, 8);
  codes.push({
    category: 'Model',
    code: modelCode,
    label: 'Model Descriptor',
    value: `${vehicle.make || 'Unknown'} ${vehicle.model || 'Unknown'}`,
  });

  // Year from VIN position 10
  const yearChar = vin.charAt(9);
  const vinYearMap: Record<string, string> = {
    A: '2010', B: '2011', C: '2012', D: '2013', E: '2014',
    F: '2015', G: '2016', H: '2017', J: '2018', K: '2019',
    L: '2020', M: '2021', N: '2022', P: '2023', R: '2024',
    S: '2025', T: '2026',
    // Also numeric for 2001-2009
    '1': '2001', '2': '2002', '3': '2003', '4': '2004',
    '5': '2005', '6': '2006', '7': '2007', '8': '2008', '9': '2009',
  };
  if (vinYearMap[yearChar]) {
    codes.push({
      category: 'Production',
      code: yearChar,
      label: 'Model Year',
      value: vinYearMap[yearChar],
    });
  }

  // Plant code — position 11
  const plantCode = vin.charAt(10);
  codes.push({
    category: 'Production',
    code: plantCode,
    label: 'Assembly Plant',
    value: `Plant code: ${plantCode}`,
  });

  // Add spec-derived codes
  if (vehicle.engineCc) {
    codes.push({
      category: 'Powertrain',
      code: 'ENG',
      label: 'Engine Displacement',
      value: `${vehicle.engineCc}cc`,
    });
  }
  if (vehicle.fuelType) {
    codes.push({
      category: 'Powertrain',
      code: 'FUEL',
      label: 'Fuel Type',
      value: vehicle.fuelType as string,
    });
  }
  if (vehicle.transmission) {
    codes.push({
      category: 'Powertrain',
      code: 'TRANS',
      label: 'Transmission',
      value: vehicle.transmission as string,
    });
  }
  if (vehicle.bodyType) {
    codes.push({
      category: 'Body',
      code: 'BODY',
      label: 'Body Type',
      value: vehicle.bodyType as string,
    });
  }

  return codes;
}

export async function buildSpecsEquipmentSection(vin: string): Promise<{
  data: SpecsEquipmentSectionData;
  recordCount: number;
  dataStatus: 'found' | 'not_found' | 'not_checked';
}> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { vin },
  });

  if (!vehicle) {
    return {
      data: {
        basicSpecs: {
          make: null, model: null, bodyType: null, year: null,
          engineCc: null, power: null, transmission: null,
          driveLayout: null, plantCountry: null,
        },
        optionCodes: [],
        kenyaAdditions: {
          steeringSide: 'RHD',
          emissionStandard: null,
          countryOfFirstReg: null,
        },
        japanAuction: null,
        importDetails: {
          originCountry: null, importDate: null, kraClearanceStatus: null,
        },
      },
      recordCount: 0,
      dataStatus: 'not_found',
    };
  }

  const optionCodes = decodeVinOptions(vin, vehicle as unknown as Record<string, unknown>);

  // Determine steering side — most JDM imports are RHD
  const steeringSide =
    vehicle.importCountry === 'JP' || vehicle.countryOfOrigin === 'JP'
      ? 'RHD'
      : vehicle.importCountry === 'UK' || vehicle.countryOfOrigin === 'UK'
        ? 'RHD'
        : 'LHD';

  const data: SpecsEquipmentSectionData = {
    basicSpecs: {
      make: vehicle.make,
      model: vehicle.model,
      bodyType: vehicle.bodyType,
      year: vehicle.year,
      engineCc: vehicle.engineCc,
      power: vehicle.engineCc
        ? `~${Math.round(vehicle.engineCc * 0.075)} hp (est.)`
        : null,
      transmission: vehicle.transmission,
      driveLayout: null, // Future: from VIN decode API
      plantCountry: vehicle.countryOfOrigin,
    },
    optionCodes,
    kenyaAdditions: {
      steeringSide,
      emissionStandard: null, // Future: from VIN decode
      countryOfFirstReg: vehicle.countryOfOrigin,
    },
    japanAuction:
      vehicle.japanAuctionGrade || vehicle.japanAuctionMileage
        ? {
            grade: vehicle.japanAuctionGrade,
            mileageAtExport: vehicle.japanAuctionMileage,
            auctionHouse: null, // Future: from BE FORWARD data
          }
        : null,
    importDetails: {
      originCountry: vehicle.countryOfOrigin,
      importDate: null, // Future: from KRA import events
      kraClearanceStatus: null, // Future: from KRA events
    },
  };

  return {
    data,
    recordCount: optionCodes.length + 1, // specs + codes
    dataStatus: 'found',
  };
}
