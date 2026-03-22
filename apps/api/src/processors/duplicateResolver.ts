// apps/api/src/processors/duplicateResolver.ts
import prisma from '../lib/prisma';

export interface EventCandidate {
  vin: string;
  event_type: string;
  event_date: Date;
  source_ref?: string | null;
}

const DEDUP_WINDOW_DAYS = 30;

/**
 * Checks whether an event is a duplicate.
 * Duplicate = same VIN + same event_type + event_date within ±30 days + same source_ref.
 */
export async function isDuplicateEvent(candidate: EventCandidate): Promise<boolean> {
  const { vin, event_type, event_date, source_ref } = candidate;

  const windowStart = new Date(event_date);
  windowStart.setDate(windowStart.getDate() - DEDUP_WINDOW_DAYS);

  const windowEnd = new Date(event_date);
  windowEnd.setDate(windowEnd.getDate() + DEDUP_WINDOW_DAYS);

  const where: Record<string, unknown> = {
    vin,
    event_type,
    event_date: {
      gte: windowStart,
      lte: windowEnd,
    },
  };

  // Only filter by source_ref if provided — null source_ref matches any
  if (source_ref) {
    where.source_ref = source_ref;
  }

  const existing = await prisma.vehicle_events.findFirst({ where });
  return existing !== null;
}

/**
 * Filters a batch of event candidates, returning only non-duplicates.
 */
export async function filterDuplicateEvents(
  candidates: EventCandidate[]
): Promise<EventCandidate[]> {
  const results: EventCandidate[] = [];

  for (const candidate of candidates) {
    const isDupe = await isDuplicateEvent(candidate);
    if (!isDupe) {
      results.push(candidate);
    }
  }

  return results;
}
