// apps/web/src/components/report/ServiceSection.tsx

interface ServiceRecord {
  date: string;
  garageName: string;
  county?: string;
  mileageAtService?: number;
  workDone: string;
  workTypes?: string[];
  source?: string;
}

interface ServiceSectionData {
  records: ServiceRecord[];
  totalRecords: number;
}

const WORK_COLORS: Record<string, string> = {
  'Oil change':       'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Brake service':    'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Timing belt':      'bg-red-600/10 text-red-400 border-red-600/20',
  'Major service':    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Accident repair':  'bg-red-600/10 text-red-400 border-red-600/20',
  'Inspection':       'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export function ServiceSection({ data }: { data: ServiceSectionData }) {
  const records = data?.records || [];

  if (records.length === 0) {
    return (
      <div className="p-6 text-center text-cc-muted">
        <span className="text-4xl block mb-2">🔧</span>
        <p className="text-sm">No service records found in our database.</p>
        <p className="text-xs mt-1">Source: Auto Express Kenya · Peach Cars · Community contributions</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3">
      {records
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((rec, i) => (
          <div key={i} className="cc-card-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-cc-text">{rec.garageName}</span>
                  {rec.county && (
                    <span className="cc-pill bg-cc-surface text-cc-muted text-xs">📍 {rec.county}</span>
                  )}
                </div>

                <p className="text-sm text-cc-muted mt-1 leading-relaxed">{rec.workDone}</p>

                {/* Work type tags */}
                {rec.workTypes && rec.workTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {rec.workTypes.map(wt => (
                      <span
                        key={wt}
                        className={`cc-pill text-xs border ${WORK_COLORS[wt] || 'bg-cc-surface text-cc-muted border-cc-border'}`}
                      >
                        {wt}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs font-mono text-cc-muted">
                  {new Date(rec.date).toLocaleDateString('en-KE', { year: 'numeric', month: 'short' })}
                </p>
                {rec.mileageAtService && (
                  <p className="text-xs text-cc-faint mt-0.5">{rec.mileageAtService.toLocaleString()} km</p>
                )}
                {rec.source && <p className="text-xs text-cc-faint mt-0.5">{rec.source}</p>}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
