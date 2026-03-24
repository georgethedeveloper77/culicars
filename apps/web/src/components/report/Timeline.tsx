// apps/web/src/components/report/Timeline.tsx

interface TimelineEvent {
  id: string;
  eventType: string;
  eventDate: string;
  county?: string;
  country?: string;
  source: string;
  sourceRef?: string;
  metadata?: Record<string, unknown>;
}

interface TimelineSectionData {
  events: TimelineEvent[];
}

const EVENT_META: Record<string, { label: string; icon: string; color: string }> = {
  MANUFACTURED: { label: 'Manufactured', icon: '🏭', color: 'text-cc-muted' },
  REGISTERED: { label: 'Registered', icon: '📋', color: 'text-blue-400' },
  INSPECTED: { label: 'NTSA Inspection', icon: '🔍', color: 'text-blue-400' },
  INSPECTION_FAILED: { label: 'Inspection Failed', icon: '✕', color: 'text-red-400' },
  DAMAGED: { label: 'Damage Recorded', icon: '💥', color: 'text-orange-400' },
  REPAIRED: { label: 'Repaired', icon: '🔧', color: 'text-emerald-400' },
  SERVICED: { label: 'Service Record', icon: '⚙️', color: 'text-cc-muted' },
  STOLEN: { label: 'Reported Stolen', icon: '🚨', color: 'text-red-400' },
  RECOVERED: { label: 'Vehicle Recovered', icon: '✓', color: 'text-emerald-400' },
  WANTED: { label: 'Wanted', icon: '⚠', color: 'text-red-400' },
  IMPORTED: { label: 'Imported to Kenya', icon: '🚢', color: 'text-blue-400' },
  EXPORTED: { label: 'Exported', icon: '✈️', color: 'text-cc-muted' },
  KRA_CLEARED: { label: 'KRA Cleared', icon: '🏛️', color: 'text-emerald-400' },
  OWNERSHIP_CHANGE: { label: 'Ownership Change', icon: '👤', color: 'text-amber-400' },
  PSV_LICENSED: { label: 'PSV Licensed', icon: '🚌', color: 'text-amber-400' },
  PSV_REVOKED: { label: 'PSV License Revoked', icon: '🚌', color: 'text-red-400' },
  LISTED_FOR_SALE: { label: 'Listed for Sale', icon: '📦', color: 'text-cc-muted' },
  SOLD: { label: 'Sold', icon: '💰', color: 'text-cc-muted' },
  AUCTIONED: { label: 'Auctioned', icon: '🏷️', color: 'text-cc-muted' },
  CONTRIBUTION_ADDED: { label: 'Data Contributed', icon: '👥', color: 'text-cc-muted' },
  ADMIN_NOTE: { label: 'Admin Note', icon: '📝', color: 'text-cc-faint' },
};

function getSourceLabel(source: string) {
  const map: Record<string, string> = {
    ntsa_cor: 'NTSA COR',
    kra: 'KRA',
    scraper_jiji: 'Jiji.co.ke',
    scraper_pigiame: 'PigiaMe',
    scraper_olx: 'OLX Kenya',
    scraper_autochek: 'Autochek',
    scraper_autoexpress: 'Auto Express KE',
    scraper_kra_ibid: 'KRA iBid',
    scraper_auction: 'Auction',
    scraper_beforward: 'BE FORWARD',
    contribution: 'User contribution',
    community_stolen_report: 'Community report',
    admin: 'Admin',
  };
  return map[source] || source;
}

export function Timeline({ data }: { data: TimelineSectionData }) {
  const events = (Array.isArray(data?.events) ? data.events : [])
    .slice()
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  if (events.length === 0) {
    return (
      <div className="p-6 text-center text-cc-muted">
        <p className="text-sm">No timeline events recorded.</p>
      </div>
    );
  }

  // Group by year
  const byYear = events.reduce<Record<string, TimelineEvent[]>>((acc, ev) => {
    const yr = new Date(ev.eventDate).getFullYear().toString();
    if (!acc[yr]) acc[yr] = [];
    acc[yr].push(ev);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="space-y-6">
        {Object.entries(byYear)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([year, evs]) => (
            <div key={year}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono font-bold text-cc-accent">{year}</span>
                <div className="flex-1 h-px bg-cc-border" />
              </div>

              <div className="space-y-2 pl-4 border-l border-cc-border">
                {evs.map(ev => {
                  const meta = EVENT_META[ev.eventType] || { label: ev.eventType, icon: '●', color: 'text-cc-muted' };
                  return (
                    <div key={ev.id} className="relative pl-4 group">
                      {/* Timeline dot */}
                      <div className={`absolute left-[-0.4rem] top-2 w-2 h-2 rounded-full bg-cc-border group-hover:bg-cc-accent transition-colors`} />

                      <div className="cc-card-2 p-3 hover:border-cc-border-2 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="text-base mt-0.5">{meta.icon}</span>
                            <div>
                              <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-cc-faint font-mono">
                                  {new Date(ev.eventDate).toLocaleDateString('en-KE', {
                                    year: 'numeric', month: 'short', day: 'numeric',
                                  })}
                                </span>
                                {ev.county && (
                                  <span className="cc-pill bg-cc-surface text-cc-muted text-xs">
                                    📍 {ev.county}
                                  </span>
                                )}
                                <span className="text-xs text-cc-faint">
                                  {getSourceLabel(ev.source)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
