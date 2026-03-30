// apps/web/src/app/watch/insights/page.tsx
import { Suspense } from 'react';

async function fetchInsights() {
  const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';
  try {
    const res = await fetch(`${API}/analytics/watch/public`, {
      next: { revalidate: 300 }, // cache 5 minutes
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function WatchInsightsPage() {
  const insights = await fetchInsights();

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Vehicle watch insights</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Aggregated community intelligence from verified watch alerts across Kenya.
        </p>

        {!insights ? (
          <p className="text-muted-foreground text-sm">No insights available yet.</p>
        ) : (
          <div className="space-y-10">
            {/* Hotspot areas */}
            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">Top alert areas</h2>
              {insights.topHotspots?.length > 0 ? (
                <div className="space-y-2">
                  {insights.topHotspots.map((h: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3">
                      <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-sm text-foreground flex-1 font-mono">{h.area}</span>
                      <span className="text-xs text-muted-foreground">{h.alertCount} alerts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hotspot data yet.</p>
              )}
            </section>

            {/* Most reported models */}
            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">Most reported vehicle models</h2>
              {insights.mostReportedModels?.length > 0 ? (
                <div className="space-y-2">
                  {insights.mostReportedModels.map((m: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-3">
                      <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                      <span className="text-sm text-foreground flex-1">
                        {m.make} {m.model}
                      </span>
                      <span className="text-xs text-muted-foreground">{m.count} reports</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No model data yet.</p>
              )}
            </section>

            {/* Summary stats */}
            <section>
              <h2 className="text-base font-semibold text-foreground mb-3">Community activity</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-2xl font-bold text-foreground">{insights.totalAlerts ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total alerts submitted</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-2xl font-bold text-foreground">
                    {insights.approvalRate != null
                      ? `${Math.round(insights.approvalRate * 100)}%`
                      : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Verified by moderators</p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
