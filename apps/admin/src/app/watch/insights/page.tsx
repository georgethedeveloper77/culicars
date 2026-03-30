// apps/admin/src/app/watch/insights/page.tsx
'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

interface WatchInsights {
  topHotspots: { area: string; alertCount: number }[];
  mostReportedModels: { make: string; model: string; count: number }[];
  approvalRate: number;
  pendingCount: number;
  totalAlerts: number;
}

export default function AdminWatchInsightsPage() {
  const [insights, setInsights] = useState<WatchInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/analytics/watch`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setInsights)
      .catch(() => setError('Could not load watch insights'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-muted-foreground text-sm">Loading…</div>;
  if (error) return <div className="p-8 text-destructive text-sm">{error}</div>;
  if (!insights) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold text-foreground mb-6">Watch insights</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-3xl font-bold text-foreground">{insights.totalAlerts}</p>
          <p className="text-sm text-muted-foreground mt-1">Total alerts</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-3xl font-bold text-amber-500">{insights.pendingCount}</p>
          <p className="text-sm text-muted-foreground mt-1">Pending review</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-3xl font-bold text-foreground">
            {Math.round(insights.approvalRate * 100)}%
          </p>
          <p className="text-sm text-muted-foreground mt-1">Approval rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Top hotspot areas</h2>
          <div className="space-y-2">
            {insights.topHotspots.length === 0 && (
              <p className="text-xs text-muted-foreground">No data yet.</p>
            )}
            {insights.topHotspots.map((h, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground font-mono text-xs">{h.area}</span>
                <span className="text-foreground font-medium">{h.alertCount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Most reported models</h2>
          <div className="space-y-2">
            {insights.mostReportedModels.length === 0 && (
              <p className="text-xs text-muted-foreground">No data yet.</p>
            )}
            {insights.mostReportedModels.map((m, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {m.make} {m.model}
                </span>
                <span className="text-muted-foreground">{m.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
