// apps/web/src/components/report/RiskBadge.tsx

type RiskLevel = 'clean' | 'low' | 'medium' | 'high' | 'critical';

const RISK_META: Record<RiskLevel, { label: string; emoji: string; classes: string }> = {
  clean:    { label: 'CLEAN',    emoji: '✓', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  low:      { label: 'LOW RISK', emoji: '●', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  medium:   { label: 'MEDIUM',   emoji: '▲', classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  high:     { label: 'HIGH RISK',emoji: '⚠', classes: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  critical: { label: 'CRITICAL', emoji: '✕', classes: 'bg-red-600/10 text-red-400 border-red-600/30' },
};

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ level, score, size = 'md' }: RiskBadgeProps) {
  const meta = RISK_META[level] || RISK_META.clean;

  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5 font-bold',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${sizeClass} ${meta.classes}`}>
      <span className="text-[0.7em]">{meta.emoji}</span>
      {meta.label}
      {score !== undefined && <span className="opacity-60 font-normal">({score})</span>}
    </span>
  );
}
