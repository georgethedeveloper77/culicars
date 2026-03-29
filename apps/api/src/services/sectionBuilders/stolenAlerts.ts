// apps/api/src/services/sectionBuilders/stolenAlerts.ts

export interface StolenAlertItem {
  id: string;
  type: string;
  status: string;
  reportedAt: string;
  description: string | null;
  location: string | null;
}

export interface StolenAlertsSection {
  sectionType: 'stolen_alerts';
  locked: false;
  isStolen: boolean;
  isRecovered: boolean;
  alerts: StolenAlertItem[];
}

export function buildStolenAlertsSection(watchAlerts: any[]): StolenAlertsSection {
  const stolenTypes = ['stolen_vehicle', 'recovered_vehicle'];
  const relevant = watchAlerts.filter(
    (a) => stolenTypes.includes(a.type) && a.status === 'approved'
  );

  const isStolen = relevant.some((a) => a.type === 'stolen_vehicle');
  const isRecovered = relevant.some((a) => a.type === 'recovered_vehicle');

  const alerts: StolenAlertItem[] = relevant.map((a) => ({
    id: a.id,
    type: a.type,
    status: a.status,
    reportedAt: a.created_at,
    description: a.description ?? null,
    location:
      a.lat != null && a.lng != null ? `${a.lat},${a.lng}` : null,
  }));

  return {
    sectionType: 'stolen_alerts',
    locked: false,
    isStolen,
    isRecovered,
    alerts,
  };
}
