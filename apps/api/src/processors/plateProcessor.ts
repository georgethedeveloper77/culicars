// apps/api/src/processors/plateProcessor.ts
import prisma from '../lib/prisma';

export interface PlateVinData {
  plate: string;        // Normalized: 'KCA123A'
  plateDisplay: string; // Formatted: 'KCA 123A'
  vin: string;
  confidence: number;
  source: string;
}

/**
 * Upserts plate_vin_map.
 * Higher confidence sources update the existing record.
 * One VIN can have multiple plates (re-registration).
 */
export async function processPlate(data: PlateVinData): Promise<void> {
  const existing = await prisma.plateVinMap.findFirst({
    where: { plate: data.plate, vin: data.vin },
  });

  if (!existing) {
    await prisma.plateVinMap.create({
      data: {
        plate: data.plate,
        plateDisplay: data.plateDisplay,
        vin: data.vin,
        confidence: data.confidence,
        source: data.source as any,
        verifiedAt: data.confidence >= 0.9 ? new Date() : null,
      },
    });
    return;
  }

  // Only update if incoming confidence is higher
  if (data.confidence > (existing.confidence ?? 0)) {
    await prisma.plateVinMap.update({
      where: { id: existing.id },
      data: {
        confidence: data.confidence,
        source: data.source as any,
        verifiedAt: data.confidence >= 0.9 ? new Date() : existing.verifiedAt,
      },
    });
  }
}

/**
 * Normalize a Kenya plate to canonical form: 'KCA123A'
 */
export function normalizePlate(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase();
}

/**
 * Format a normalized plate for display: 'KCA 123A'
 */
export function formatPlate(normalized: string): string {
  // KXX 000X pattern
  const match = normalized.match(/^([A-Z]{2,3})(\d{3,4})([A-Z]?)$/);
  if (match) {
    return match[3] ? `${match[1]} ${match[2]}${match[3]}` : `${match[1]} ${match[2]}`;
  }
  // GK XXXX, CD XXX patterns
  const govMatch = normalized.match(/^(GK|GN|CD|UN)(\d+)$/);
  if (govMatch) return `${govMatch[1]} ${govMatch[2]}`;
  return normalized;
}
