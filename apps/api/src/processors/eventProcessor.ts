// apps/api/src/processors/eventProcessor.ts
import prisma from '../lib/prisma';
import { isDuplicateEvent } from './duplicateResolver';

export interface VehicleEventData {
  vin: string;
  event_type: string;
  event_date: Date;
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
    event_type: data.event_type as any,
    event_date: data.event_date,
    source_ref: data.source_ref,
  });

  if (isDupe) return false;

  await prisma.vehicle_events.create({
    data: {
      vin: data.vin,
      event_type: data.event_type as any,
      event_date: data.event_date,
      country: data.country ?? 'KE',
      county: data.county ?? null,
      source: data.source as any,
      source_ref: data.source_ref ?? null,
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
