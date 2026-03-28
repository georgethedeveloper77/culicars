// apps/api/src/processors/duplicateResolver.ts
import prisma from '../lib/prisma';

export interface EventCandidate {
  vin: string;
  event_type: string;
  event_date: Date;
  source_ref?: string | null;
}

const DEDUP_WINDOW_DAYS = 30;

export async function isDuplicateEvent(candidate: EventCandidate): Promise<boolean> {
  const { vin, event_type, event_date, source_ref } = candidate;

  const windowStart = new Date(event_date);
  windowStart.setDate(windowStart.getDate() - DEDUP_WINDOW_DAYS);

  const windowEnd = new Date(event_date);
  windowEnd.setDate(windowEnd.getDate() + DEDUP_WINDOW_DAYS);

  const existing = await prisma.vehicleEvent.findFirst({
    where: {
      vin,
      eventType: event_type,
      eventDate: { gte: windowStart, lte: windowEnd },
      ...(source_ref ? { sourceRef: source_ref } : {}),
    },
  });

  return existing !== null;
}

export async function filterDuplicateEvents(
  candidates: EventCandidate[]
): Promise<EventCandidate[]> {
  const results: EventCandidate[] = [];
  for (const candidate of candidates) {
    const isDupe = await isDuplicateEvent(candidate);
    if (!isDupe) results.push(candidate);
  }
  return results;
}
