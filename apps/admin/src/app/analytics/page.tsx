// apps/admin/src/app/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

interface Metric { date: string; count: number }
interface BusinessMetrics {
  searchesLast30Days: Metric[];
  reportsUnlocked: Metric[];
  revenueLast30Days: { date: string; amountKes: number }[];
  conversionRate: number;
  totalCreditsIssued: number;
  totalCreditsConsumed: number;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function MiniChart({ data, label }: { data: { date: string; count: number }[]; label: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <p className="text-sm font-medium text-foreground mb-3">{label}</p>
      <div className="flex items-end gap-1 h-16">
        {data.slice(-30).map((d, i) => (
          <div
            key={i}
            title={`${d.date}: ${d.count}`}
            className="flex-1 bg-primary/70 rounded-t-sm min-h-[2px]"
            style={{ height: `${(d.count / max) * 100}%` }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/analytics/business`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => setError('Could not load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-muted-foreground text-sm">Loading…</div>;
  if (error) return <div className="p-8 text-destructive text-sm">{error}</div>;
  if (!metrics) return null;

  const totalSearches = metrics.searchesLast30Days.reduce((s, r) => s + r.count, 0);
  const totalUnlocks = metrics.reportsUnlocked.reduce((s, r) => s + r.count, 0);
  const totalRevenue = metrics.revenueLast30Days.reduce((s, r) => s + r.amountKes, 0);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-6">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Searches (30d)" value={totalSearches.toLocaleString()} />
        <Stat label="Unlocks (30d)" value={totalUnlocks.toLocaleString()} />
        <Stat label="Conversion rate" value={`${Math.round(metrics.conversionRate * 100)}%`} />
        <Stat label="Revenue KES (30d)" value={`KES ${totalRevenue.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <MiniChart data={metrics.searchesLast30Days} label="Daily searches" />
        <MiniChart data={metrics.reportsUnlocked} label="Daily unlocks" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Stat label="Credits issued total" value={metrics.totalCreditsIssued.toLocaleString()} />
        <Stat label="Credits consumed total" value={metrics.totalCreditsConsumed.toLocaleString()} />
      </div>
    </div>
  );
}
