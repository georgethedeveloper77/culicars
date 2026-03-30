// apps/api/src/services/sectionBuilders/identity.ts

export interface IdentitySection {
  section_type: 'identity';
  locked: false;
  plate: string | null;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  engineSize: string | null;
  fuel_type: string | null;
  body_type: string | null;
  registrationDate: string | null;
  confidence: number;
  sourceCount: number;
}

export function buildIdentitySection(records: any[]): IdentitySection {
  const pick = (field: string): any => {
    const sorted = records
      .filter((r) => r.normalised_json?.[field] != null)
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
    return sorted[0]?.normalised_json?.[field] ?? null;
  };

  const avgConfidence =
    records.length > 0
      ? records.reduce((sum, r) => sum + (r.confidence ?? 0), 0) / records.length
      : 0;

  return {
    section_type: 'identity',
    locked: false,
    plate: pick('plate'),
    vin: pick('vin'),
    make: pick('make'),
    model: pick('model'),
    year: pick('year'),
    color: pick('color'),
    engineSize: pick('engine_size'),
    fuel_type: pick('fuel_type'),
    body_type: pick('body_type'),
    registrationDate: pick('registration_date'),
    confidence: Math.round(avgConfidence * 100) / 100,
    sourceCount: records.length,
  };
}
