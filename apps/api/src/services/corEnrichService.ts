// ============================================================
// CuliCars — Thread 4: COR Enrichment Service
// ============================================================
// After NTSA COR is parsed, this service:
// 1. Updates or creates the vehicle record
// 2. Sets plate_vin_map confidence to 1.0 (highest trust)
// 3. Creates REGISTERED + OWNERSHIP_CHANGE vehicle events
// 4. Marks cor_consents as processed

import prisma from '../lib/prisma';
import type { NtsaCorParsed } from '../types/ocr.types';

interface EnrichmentResult {
  vehicleUpdated: boolean;
  vehicleCreated: boolean;
  plateVinMapUpdated: boolean;
  eventsCreated: number;
  consentProcessed: boolean;
}

/**
 * Enrich vehicle data from a parsed NTSA COR.
 * This is the highest-trust data source (confidence = 1.0).
 *
 * Runs in a single transaction for atomicity.
 */
export async function enrichFromCor(
  parsed: NtsaCorParsed,
  consentId: string,
  userId: string
): Promise<EnrichmentResult> {
  if (!parsed.vin || !parsed.plate) {
    throw new Error('COR must contain both VIN and plate to enrich');
  }

  const result: EnrichmentResult = {
    vehicleUpdated: false,
    vehicleCreated: false,
    plateVinMapUpdated: false,
    eventsCreated: 0,
    consentProcessed: false,
  };

  await prisma.$transaction(async (tx) => {
    // ---- 1. Upsert vehicle record ----
    const existingVehicle = await tx.vehicle.findUnique({
      where: { vin: parsed.vin },
    });

    const vehicleData = buildVehicleData(parsed);

    if (existingVehicle) {
      await tx.vehicle.update({
        where: { vin: parsed.vin },
        data: vehicleData,
      });
      result.vehicleUpdated = true;
    } else {
      await tx.vehicle.create({
        data: {
          vin: parsed.vin,
          ...vehicleData,
        },
      });
      result.vehicleCreated = true;
    }

    // ---- 2. Upsert plate_vin_map with confidence 1.0 ----
    const existingMapping = await tx.plateVinMap.findFirst({
      where: {
        plate: parsed.plate,
        vin: parsed.vin,
      },
    });

    if (existingMapping) {
      await tx.plateVinMap.update({
        where: { id: existingMapping.id },
        data: {
          confidence: 1.0,        // NTSA COR = highest trust
          source: 'ntsa_cor',
          plateDisplay: parsed.plateDisplay,
          verifiedAt: new Date(),
        },
      });
    } else {
      await tx.plateVinMap.create({
        data: {
          plate: parsed.plate,
          plateDisplay: parsed.plateDisplay,
          vin: parsed.vin,
          confidence: 1.0,
          source: 'ntsa_cor',
          verifiedAt: new Date(),
        },
      });
    }
    result.plateVinMapUpdated = true;

    // ---- 3. Create vehicle events ----

    // REGISTERED event (from registration date)
    if (parsed.registrationDate) {
      const existingRegEvent = await tx.vehicleEvent.findFirst({
        where: {
          vin: parsed.vin,
          eventType: 'REGISTERED',
          source: 'ntsa_cor',
        },
      });

      if (!existingRegEvent) {
        await tx.vehicleEvent.create({
          data: {
            vin: parsed.vin,
            eventType: 'REGISTERED',
            eventDate: parsed.registrationDate,
            country: 'KE',
            source: 'ntsa_cor',
            confidence: 1.0,
            metadata: {
              logbookNumber: parsed.logbookNumber,
              plate: parsed.plate,
            },
          },
        });
        result.eventsCreated++;
      }
    }

    // OWNERSHIP_CHANGE events (from transfer count)
    if (parsed.numberOfTransfers && parsed.numberOfTransfers > 0) {
      // Check existing ownership events from COR
      const existingOwnershipEvents = await tx.vehicleEvent.count({
        where: {
          vin: parsed.vin,
          eventType: 'OWNERSHIP_CHANGE',
          source: 'ntsa_cor',
        },
      });

      // Only add if we don't already have COR-sourced ownership events
      if (existingOwnershipEvents === 0) {
        // Create one summary OWNERSHIP_CHANGE event
        // (we don't have individual transfer dates from COR)
        await tx.vehicleEvent.create({
          data: {
            vin: parsed.vin,
            eventType: 'OWNERSHIP_CHANGE',
            eventDate: parsed.lastTransferDate ?? new Date(),
            country: 'KE',
            source: 'ntsa_cor',
            confidence: 1.0,
            metadata: {
              totalTransfers: parsed.numberOfTransfers,
              lastTransferDate: parsed.lastTransferDate?.toISOString() ?? null,
              note: `${parsed.numberOfTransfers} total ownership transfer(s) per NTSA COR`,
            },
          },
        });
        result.eventsCreated++;
      }
    }

    // INSPECTED event (from inspection data)
    if (parsed.inspectionDate && parsed.inspectionStatus !== 'unknown') {
      const eventType =
        parsed.inspectionStatus === 'failed'
          ? 'INSPECTION_FAILED'
          : 'INSPECTED';

      const existingInspEvent = await tx.vehicleEvent.findFirst({
        where: {
          vin: parsed.vin,
          eventType,
          source: 'ntsa_cor',
          eventDate: parsed.inspectionDate,
        },
      });

      if (!existingInspEvent) {
        await tx.vehicleEvent.create({
          data: {
            vin: parsed.vin,
            eventType,
            eventDate: parsed.inspectionDate,
            country: 'KE',
            source: 'ntsa_cor',
            confidence: 1.0,
            metadata: {
              status: parsed.inspectionStatus,
            },
          },
        });
        result.eventsCreated++;
      }
    }

    // ---- 4. Mark consent as processed ----
    await tx.corConsent.update({
      where: { id: consentId },
      data: {
        pdfProcessed: true,
        processedAt: new Date(),
      },
    });
    result.consentProcessed = true;

    // ---- 5. Stale any existing reports for this VIN ----
    await tx.report.updateMany({
      where: {
        vin: parsed.vin,
        status: 'ready',
      },
      data: {
        status: 'stale',
      },
    });
  });

  return result;
}

/**
 * Build vehicle update data from parsed COR.
 * Only updates fields that COR provides (non-null).
 */
function buildVehicleData(parsed: NtsaCorParsed): Record<string, any> {
  const data: Record<string, any> = {
    ntsaCorVerified: true,
    ntsaCorDate: new Date(),
    ntsaCorSource: 'user_webview',
    updatedAt: new Date(),
  };

  if (parsed.make) data.make = parsed.make;
  if (parsed.model) data.model = parsed.model;
  if (parsed.bodyType) data.bodyType = parsed.bodyType;
  if (parsed.color) data.color = parsed.color;
  if (parsed.yearOfManufacture) data.year = parsed.yearOfManufacture;
  if (parsed.engineCapacity) data.engineCc = parsed.engineCapacity;
  if (parsed.fuelType) data.fuelType = parsed.fuelType;
  if (parsed.inspectionStatus !== 'unknown') {
    data.inspectionStatus = parsed.inspectionStatus;
  }
  if (parsed.inspectionDate) {
    data.lastInspectionDate = parsed.inspectionDate;
  }
  if (parsed.caveatStatus !== 'unknown') {
    data.caveatStatus = parsed.caveatStatus;
  }
  if (parsed.vin) {
    data.chassisNumber = parsed.vin; // COR chassis = VIN in most cases
  }

  return data;
}
