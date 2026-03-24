// apps/web/src/components/report/PurposeSection.tsx

interface PurposeCheck {
  type: string;
  label: string;
  icon: string;
  found: boolean;
  detail?: string;
}

interface PurposeSectionData {
  checks: PurposeCheck[];
  summary?: string;
}

const DEFAULT_PURPOSES: Omit<PurposeCheck, 'found' | 'detail'>[] = [
  { type: 'psv', label: 'PSV / Matatu', icon: '🚌' },
  { type: 'taxi', label: 'Taxi / Uber / Bolt', icon: '🚕' },
  { type: 'rental', label: 'Rental / Hire Car', icon: '🔑' },
  { type: 'transport', label: 'Transport / Lorry', icon: '🚚' },
  { type: 'police', label: 'Police / Government', icon: '🏛️' },
  { type: 'driving_school', label: 'Driving School', icon: '🎓' },
  { type: 'ambulance', label: 'Ambulance / Medical', icon: '🚑' },
];

export function PurposeSection({ data }: { data: PurposeSectionData }) {
  const checks: PurposeCheck[] = data?.checks?.length
    ? data.checks
    : DEFAULT_PURPOSES.map(p => ({ ...p, found: false }));

  const foundCount = checks.filter(c => c.found).length;

  return (
    <div className="p-6">
      {foundCount > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-amber-400 text-sm">▲</span>
          <p className="text-amber-400 text-sm font-medium">
            {foundCount} commercial use record{foundCount > 1 ? 's' : ''} found
          </p>
        </div>
      )}
      {data?.summary && (
        <p className="text-cc-muted text-sm mb-4">{data.summary}</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {checks.map(check => (
          <div
            key={check.type}
            className={`rounded-xl border p-4 flex flex-col gap-2 transition-colors ${
              check.found
                ? 'bg-amber-500/5 border-amber-500/30'
                : 'bg-cc-surface-2 border-cc-border'
            }`}
          >
            <span className="text-2xl">{check.icon}</span>
            <p className="text-xs font-medium text-cc-text leading-tight">{check.label}</p>
            {check.found ? (
              <span className="flex items-center gap-1 text-amber-400 text-xs font-medium">
                <span>▲</span> Record found
              </span>
            ) : (
              <span className="flex items-center gap-1 text-cc-faint text-xs">
                <span>✓</span> No record found
              </span>
            )}
            {check.detail && (
              <p className="text-xs text-cc-muted leading-tight">{check.detail}</p>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-cc-faint mt-4">
        Sources: NTSA PSV records · KRA registration · community contributions
      </p>
    </div>
  );
}
