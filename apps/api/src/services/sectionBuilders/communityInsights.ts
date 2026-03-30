// apps/api/src/services/sectionBuilders/communityInsights.ts

export interface CommunityInsight {
  label: string;
  value: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface CommunityInsightsSection {
  section_type: 'community_insights';
  locked: boolean;
  available: boolean; // false until T12 Watch is live with real data
  insights: CommunityInsight[];
  placeholder: string | null;
}

export function buildCommunityInsightsSection(
  watchAlerts: any[],
  vehicleMake: string | null,
  vehicleModel: string | null,
  isUnlocked: boolean
): CommunityInsightsSection {
  // T8: Watch data not yet fully live. If we have approved alerts, surface
  // basic signals. Otherwise return graceful placeholder.
  const approvedAlerts = watchAlerts.filter((a) => a.status === 'approved');

  if (approvedAlerts.length === 0) {
    return {
      section_type: 'community_insights',
      locked: !isUnlocked,
      available: false,
      insights: [],
      placeholder:
        'Community intelligence for this vehicle will appear here as Watch data grows.',
    };
  }

  const insights: CommunityInsight[] = [];

  const stolenCount = approvedAlerts.filter((a) => a.type === 'stolen_vehicle').length;
  const damageCount = approvedAlerts.filter((a) => a.type === 'damage').length;
  const hijackCount = approvedAlerts.filter((a) => a.type === 'hijack').length;

  if (stolenCount > 0) {
    insights.push({
      label: 'Theft alerts',
      value: `${stolenCount} theft report(s) linked to this vehicle`,
      severity: 'critical',
    });
  }

  if (hijackCount > 0) {
    insights.push({
      label: 'Hijack alerts',
      value: `${hijackCount} hijacking report(s) linked to this vehicle`,
      severity: 'critical',
    });
  }

  if (damageCount > 0) {
    insights.push({
      label: 'Damage reports',
      value: `${damageCount} community damage report(s)`,
      severity: 'warning',
    });
  }

  const vehicle = [vehicleMake, vehicleModel].filter(Boolean).join(' ');
  if (vehicle) {
    insights.push({
      label: 'Model context',
      value: `${vehicle} — community data will enrich this section as Watch coverage grows.`,
      severity: 'info',
    });
  }

  return {
    section_type: 'community_insights',
    locked: !isUnlocked,
    available: insights.length > 0,
    insights: isUnlocked ? insights : [],
    placeholder: isUnlocked ? null : 'Unlock to view community intelligence for this vehicle.',
  };
}
