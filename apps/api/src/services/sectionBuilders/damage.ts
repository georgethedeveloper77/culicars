// apps/api/src/services/sectionBuilders/damage.ts

export interface DamageEntry {
  date: string | null;
  location: string | null;
  description: string | null;
  source: string;
  confidence: number;
}

export interface DamageSection {
  section_type: 'damage';
  locked: boolean;
  record_count: number;
  records: DamageEntry[];
}

export function buildDamageSection(
  records: any[],
  contributions: any[],
  isUnlocked: boolean
): DamageSection {
  const damageRecords: DamageEntry[] = [];

  for (const r of records) {
    const dmg = r.normalised_json?.damage;
    if (!dmg) continue;
    const entries: any[] = Array.isArray(dmg) ? dmg : [dmg];
    for (const d of entries) {
      damageRecords.push({
        date: d.date ?? null,
        location: d.location ?? null,
        description: d.description ?? null,
        source: r.source,
        confidence: r.confidence ?? 0.5,
      });
    }
  }

  for (const c of contributions) {
    if (c.type !== 'damage_evidence' || c.status !== 'approved') continue;
    damageRecords.push({
      date: c.data_json?.date ?? null,
      location: c.data_json?.damage_location ?? null,
      description: c.data_json?.description ?? null,
      source: 'community_contribution',
      confidence: 0.4,
    });
  }

  // Sort by date descending
  damageRecords.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return {
    section_type: 'damage',
    locked: !isUnlocked,
    record_count: damageRecords.length,
    records: isUnlocked ? damageRecords : [],
  };
}
