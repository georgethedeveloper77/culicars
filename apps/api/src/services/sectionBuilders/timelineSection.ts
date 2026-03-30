// ============================================================
// CuliCars — Section Builder: TIMELINE (LOCKED)
// Chronological list of every known event in the vehicle's life
// ============================================================

import { prisma } from '../../lib/prisma';
import type { TimelineSectionData, TimelineEvent } from '../../types/report.types';

// Human-readable event type labels
const EVENT_LABELS: Record<string, string> = {
  MANUFACTURED:        'Manufactured',
  REGISTERED:          'Registered',
  INSPECTED:           'Inspected',
  INSPECTION_FAILED:   'Inspection Failed',
  DAMAGED:             'Damaged',
  REPAIRED:            'Repaired',
  SERVICED:            'Serviced',
  STOLEN:              'Reported Stolen',
  RECOVERED:           'Recovered',
  WANTED:              'Wanted',
  IMPORTED:            'Imported',
  EXPORTED:            'Exported',
  KRA_CLEARED:         'KRA Cleared',
  OWNERSHIP_CHANGE:    'Ownership Change',
  PSV_LICENSED:        'PSV Licensed',
  PSV_REVOKED:         'PSV License Revoked',
  LISTED_FOR_SALE:     'Listed for Sale',
  SOLD:                'Sold',
  AUCTIONED:           'Auctioned',
  CONTRIBUTION_ADDED:  'Contribution Added',
  ADMIN_NOTE:          'Admin Note',
};

export async function buildTimelineSection(vin: string): Promise<{
  data: TimelineSectionData;
  record_count: number;
  data_status: 'found' | 'not_found' | 'not_checked';
}> {
  const events = await prisma.vehicle_events.findMany({
    where: { vin },
    select: {
      event_type: true,
      event_date: true,
      country: true,
      county: true,
      source: true,
      source_ref: true,
      metadata: true,
    },
    orderBy: { event_date: 'asc' },
  });

  const timelineEvents: TimelineEvent[] = events.map((event) => {
    const meta = event.metadata as Record<string, unknown> | null;
    const description =
      (meta?.description as string) ||
      EVENT_LABELS[event.event_type] ||
      event.event_type;

    return {
      date: event.event_date.toISOString().split('T')[0],
      event_type: EVENT_LABELS[event.event_type] || event.event_type,
      description,
      county: event.county ?? undefined,
      country: event.country ?? 'KE',
      source: event.source ?? 'unknown',
      source_ref: event.source_ref ?? undefined,
    };
  });

  return {
    data: {
      events: timelineEvents,
      totalEvents: timelineEvents.length,
      firstEvent: timelineEvents.length > 0 ? timelineEvents[0].date : null,
      lastEvent:
        timelineEvents.length > 0
          ? timelineEvents[timelineEvents.length - 1].date
          : null,
    },
    record_count: timelineEvents.length,
    data_status: timelineEvents.length > 0 ? 'found' : 'not_found',
  };
}
