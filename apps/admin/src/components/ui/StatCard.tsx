// apps/admin/src/components/ui/StatCard.tsx
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: 'gold' | 'green' | 'red' | 'blue' | 'amber';
  sub?: string;
}

const accentMap = {
  gold:  { icon: 'text-[#D4A843]', bg: 'bg-[#D4A843]/10', border: 'border-[#D4A843]/20' },
  green: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  red:   { icon: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  blue:  { icon: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  amber: { icon: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
};

export function StatCard({ label, value, icon, accent = 'gold', sub }: StatCardProps) {
  const colors = accentMap[accent];
  return (
    <div className={`rounded-xl border ${colors.border} bg-[#141414] p-5 flex items-start gap-4`}>
      <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-bold text-zinc-100 tabular-nums">{value}</p>
        {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
