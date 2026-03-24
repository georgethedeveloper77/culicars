// apps/api/src/processors/eventProcessor.ts
import prisma from '../lib/prisma';
import { isDuplicateEvent } from './duplicateResolver';

export interface VehicleEventData {
  vin: string;
  eventType: string;
  eventDate: Date;
  country?: string;
  county?: string | null;
  source: string;
  source_ref?: string | null;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Inserts a vehicle event after deduplication check.
 * Returns true if inserted, false if skipped as duplicate.
 */
export async function insertEvent(data: VehicleEventData): Promise<boolean> {
  const isDupe = await isDuplicateEvent({
    vin: data.vin,
    event_type: data.eventType as any,
    event_date: data.eventDate,
    source_ref: data.source_ref,
  });

  if (isDupe) return false;

  await prisma.vehicleEvent.create({
    data: {
      vin: data.vin,
      eventType: data.eventType as any,
      eventDate: data.eventDate,
      country: data.country ?? 'KE',
      county: data.county ?? null,
      source: data.source as any,
      sourceRef: data.source_ref ?? null,
      confidence: data.confidence ?? 0.5,
      metadata: (data.metadata ?? {}) as any,
    },
  });

  return true;
}

/**
 * Inserts multiple events, skipping duplicates.
 * Returns count of actually inserted events.
 */
export async function insertEvents(events: VehicleEventData[]): Promise<number> {
  let inserted = 0;
  for (const event of events) {
    const ok = await insertEvent(event);
    if (ok) inserted++;
  }
  return inserted;
}
