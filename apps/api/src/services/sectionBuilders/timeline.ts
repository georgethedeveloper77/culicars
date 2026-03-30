// apps/api/src/services/sectionBuilders/timeline.ts

export interface TimelineEvent {
  date: string;
  type: string;
  label: string;
  source: string;
  confidence: number;
}

export interface TimelineSection {
  section_type: 'timeline';
  locked: boolean;
  events: TimelineEvent[];
}

export function buildTimelineSection(
  records: any[],
  contributions: any[],
  watchAlerts: any[],
  isUnlocked: boolean
): TimelineSection {
  const events: TimelineEvent[] = [];

  for (const r of records) {
    const n = r.normalised_json ?? {};

    if (n.registration_date) {
      events.push({
        date: n.registration_date,
        type: 'registration',
        label: 'Vehicle registered',
        source: r.source,
        confidence: r.confidence ?? 0.5,
      });
    }

    if (n.import_date) {
      events.push({
        date: n.import_date,
        type: 'import',
        label: 'Imported into Kenya',
        source: r.source,
        confidence: r.confidence ?? 0.5,
      });
    }

    if (n.last_transfer_date) {
      events.push({
        date: n.last_transfer_date,
        type: 'ownership_transfer',
        label: 'Ownership transferred',
        source: r.source,
        confidence: r.confidence ?? 0.5,
      });
    }

    if (Array.isArray(n.service_records)) {
      for (const s of n.service_records) {
        if (s.date) {
          events.push({
            date: s.date,
            type: 'service',
            label: s.work_summary ?? 'Service record',
            source: r.source,
            confidence: r.confidence ?? 0.5,
          });
        }
      }
    }
  }

  for (const c of contributions) {
    if (c.status !== 'approved') continue;
    const d = c.data_json ?? {};

    if (c.type === 'service_record' && d.service_date) {
      events.push({
        date: d.service_date,
        type: 'service',
        label: d.work_summary ?? 'Community-reported service',
        source: 'community_contribution',
        confidence: 0.4,
      });
    }
  }

  for (const a of watchAlerts) {
    if (a.status !== 'approved') continue;
    events.push({
      date: a.created_at,
      type: a.type,
      label: formatAlertLabel(a.type),
      source: 'watch_community',
      confidence: 0.6,
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    section_type: 'timeline',
    locked: !isUnlocked,
    events: isUnlocked ? events : [],
  };
}

function formatAlertLabel(type: string): string {
  const map: Record<string, string> = {
    stolen_vehicle: 'Reported stolen',
    recovered_vehicle: 'Reported recovered',
    damage: 'Damage reported',
    vandalism: 'Vandalism reported',
    parts_theft: 'Parts theft reported',
    suspicious_activity: 'Suspicious activity reported',
    hijack: 'Hijacking reported',
  };
  return map[type] ?? 'Community alert';
}
