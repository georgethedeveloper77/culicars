// apps/api/src/services/sectionBuilders/communityInsightsBuilder.ts
// Replaces the placeholder stub from T8.
// Called by reportGenerator.ts to build the communityInsights section.

const API_INTERNAL = process.env.INTERNAL_API_URL ?? 'http://localhost:3001';

export interface CommunityInsightsSection {
  type: 'communityInsights';
  locked: boolean;
  hasAlerts: boolean;
  alertCount: number;
  alertTypes: string[];
  recentAlerts: {
    type: string;
    description: string | null;
    created_at: string;
  }[];
  summary: string;
}

export async function buildCommunityInsightsSection(
  plate: string | null,
  vin: string | null
): Promise<CommunityInsightsSection> {
  const empty: CommunityInsightsSection = {
    type: 'communityInsights',
    locked: false,
    hasAlerts: false,
    alertCount: 0,
    alertTypes: [],
    recentAlerts: [],
    summary: 'No community alerts on record for this vehicle.',
  };

  if (!plate && !vin) return empty;

  try {
    const params = new URLSearchParams();
    if (plate) params.set('plate', plate);
    else if (vin) params.set('vin', vin!);

    const res = await fetch(`${API_INTERNAL}/watch/insights/vehicle?${params}`);
    if (!res.ok) return empty;

    const data = await res.json();
    return {
      type: 'communityInsights',
      locked: false,
      hasAlerts: (data as any).hasAlerts ?? false,
      alertCount: (data as any).alertCount ?? 0,
      alertTypes: (data as any).alertTypes ?? [],
      recentAlerts: ((data as any).recentAlerts ?? []).map((a: any) => ({
        type: a.type,
        description: a.description ?? null,
        created_at: a.createdAt,
      })),
      summary: (data as any).summary ?? empty.summary,
    };
  } catch (err) {
    console.warn('[communityInsightsBuilder] failed to fetch signals', err);
    return empty;
  }
}
