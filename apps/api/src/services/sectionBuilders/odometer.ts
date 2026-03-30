// apps/api/src/services/sectionBuilders/odometer.ts

export interface OdometerReading {
  date: string | null;
  value: number;
  unit: 'km' | 'miles';
  source: string;
  confidence: number;
}

export interface OdometerSection {
  section_type: 'odometer';
  locked: boolean;
  anomalyDetected: boolean;
  latestReading: OdometerReading | null;
  readings: OdometerReading[];
}

function normaliseToKm(value: number, unit: string): number {
  return unit === 'miles' ? Math.round(value * 1.60934) : value;
}

export function buildOdometerSection(
  records: any[],
  contributions: any[],
  isUnlocked: boolean
): OdometerSection {
  const readings: OdometerReading[] = [];

  for (const r of records) {
    const odo = r.normalised_json?.odometer;
    if (!odo) continue;
    const entries: any[] = Array.isArray(odo) ? odo : [odo];
    for (const o of entries) {
      if (o.value == null) continue;
      readings.push({
        date: o.date ?? null,
        value: o.value,
        unit: o.unit ?? 'km',
        source: r.source,
        confidence: r.confidence ?? 0.5,
      });
    }
  }

  for (const c of contributions) {
    if (c.type !== 'odometer_reading' || c.status !== 'approved') continue;
    const val = c.data_json?.odometer_value;
    if (val == null) continue;
    readings.push({
      date: c.data_json?.date_observed ?? null,
      value: val,
      unit: 'km',
      source: 'community_contribution',
      confidence: 0.4,
    });
  }

  readings.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Anomaly detection: rollback check
  let anomalyDetected = false;
  const kmReadings = readings.map((r) => normaliseToKm(r.value, r.unit));
  for (let i = 1; i < kmReadings.length; i++) {
    if (kmReadings[i] < kmReadings[i - 1] * 0.9) {
      anomalyDetected = true;
      break;
    }
  }

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

  return {
    section_type: 'odometer',
    locked: !isUnlocked,
    anomalyDetected,
    latestReading: isUnlocked ? latestReading : null,
    readings: isUnlocked ? readings : [],
  };
}
