// apps/web/src/components/report/TheftSection.tsx
import Link from 'next/link';

interface TheftCheck {
  db: string;
  label: string;
  icon: string;
  status: 'wanted' | 'stolen_past' | 'recovered' | 'clean' | 'not_checked';
  detail?: string;
  date?: string;
  obNumber?: string;
}

interface CommunityReport {
  id: string;
  date: string;
  county: string;
  obNumber?: string;
  isObVerified: boolean;
  status: string;
  color?: string;
}

interface TheftSectionData {
  checks: TheftCheck[];
  communityReports: CommunityReport[];
  plate?: string;
}

const STATUS_STYLES = {
  wanted:       { color: 'text-red-400',     bg: 'bg-red-600/10',     border: 'border-red-600/30',     label: '● Currently wanted' },
  stolen_past:  { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  label: '⚠ Stolen in the past' },
  recovered:    { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    label: '✓ Recovered' },
  clean:        { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: '✓ No record' },
  not_checked:  { color: 'text-cc-faint',    bg: 'bg-cc-surface-2',   border: 'border-cc-border',      label: '— Not checked' },
};

export function TheftSection({ data }: { data: TheftSectionData }) {
  const checks: TheftCheck[] = data?.checks || [
    { db: 'kenya_police', label: 'Kenya Police Database', icon: '🚔', status: 'not_checked' },
    { db: 'ntsa_wanted', label: 'NTSA Wanted Vehicles', icon: '🏛️', status: 'not_checked' },
    { db: 'interpol', label: 'Interpol (International)', icon: '🌍', status: 'not_checked' },
    { db: 'community', label: 'CuliCars Community Reports', icon: '👥', status: 'not_checked' },
  ];

  const communityReports: CommunityReport[] = data?.communityReports || [];

  return (
    <div className="p-6 space-y-6">
      {/* DB check cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        {checks.map(check => {
          const style = STATUS_STYLES[check.status] || STATUS_STYLES.not_checked;
          return (
            <div key={check.db} className={`rounded-xl border p-4 ${style.bg} ${style.border}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{check.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cc-text">{check.label}</p>
                  <span className={`text-xs font-medium ${style.color}`}>{style.label}</span>
                  {check.detail && <p className="text-xs text-cc-muted mt-1">{check.detail}</p>}
                  {check.date && (
                    <p className="text-xs text-cc-faint mt-1">
                      {new Date(check.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                  {check.obNumber && (
                    <p className="text-xs text-cc-muted mt-1">OB: <span className="font-mono">{check.obNumber}</span></p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Community reports */}
      {communityReports.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-cc-text mb-3">Community Stolen Reports</p>
          <div className="space-y-3">
            {communityReports.map(rep => (
              <div key={rep.id} className="cc-card-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`cc-pill text-xs ${
                        rep.status === 'active'
                          ? 'bg-red-600/10 text-red-400 border border-red-600/30'
                          : rep.status === 'recovered'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-cc-surface text-cc-muted'
                      }`}>
                        {rep.status === 'active' ? '● STOLEN' : rep.status === 'recovered' ? '✓ RECOVERED' : rep.status}
                      </span>
                      {rep.isObVerified && (
                        <span className="cc-pill bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs">
                          🏛️ OB Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-cc-text">
                      Reported stolen on{' '}
                      <span className="font-semibold">
                        {new Date(rep.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {' '}in <span className="font-semibold">{rep.county}</span>
                    </p>
                    {rep.obNumber && (
                      <p className="text-xs text-cc-muted mt-1">Police OB: <span className="font-mono">{rep.obNumber}</span></p>
                    )}
                    {rep.color && <p className="text-xs text-cc-muted">Color: {rep.color}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report stolen CTA */}
      <div className="border border-dashed border-cc-border-2 rounded-xl p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cc-text">Know this vehicle is stolen?</p>
          <p className="text-xs text-cc-muted mt-0.5">All reports are admin-reviewed. OB number adds credibility.</p>
        </div>
        <Link
          href={data?.plate ? `/report-stolen/${data.plate}` : '/report-stolen'}
          className="cc-btn-danger shrink-0 text-xs"
        >
          Report Stolen
        </Link>
      </div>
    </div>
  );
}
