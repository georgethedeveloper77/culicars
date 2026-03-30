// apps/web/src/app/watch/insights/page.tsx
import { Suspense } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

async function getInsights() {
  try {
    const res = await fetch(`${API}/watch/insights`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const ALERT_LABELS: Record<string, string> = {
  stolen_vehicle: 'Stolen vehicle',
  recovered_vehicle: 'Recovery',
  damage: 'Damage',
  vandalism: 'Vandalism',
  parts_theft: 'Parts theft',
  suspicious_activity: 'Suspicious activity',
  hijack: 'Hijacking',
};

export default async function WatchInsightsPage() {
  const data = await getInsights();

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Watch Insights</h1>
      <p className="text-sm text-gray-500 mb-8">
        Aggregated community intelligence from verified vehicle alerts across Kenya.
      </p>

      {!data ? (
        <p className="text-gray-500 text-sm">No insights available at this time.</p>
      ) : (
        <div className="space-y-8">
          {/* Alert type breakdown */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Alert breakdown</h2>
            <div className="space-y-2">
              {(data.alertTypes ?? []).map((item: { type: string; count: number }) => {
                const max = data.alertTypes[0]?.count ?? 1;
                const pct = Math.round((item.count / max) * 100);
                return (
                  <div key={item.type}>
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="text-gray-700 dark:text-gray-300">
                        {ALERT_LABELS[item.type] ?? item.type}
                      </span>
                      <span className="text-gray-500 tabular-nums">{item.count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recent activity */}
          <section>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Recent activity</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data.recentCount ?? 0} alerts verified in the last 30 days.
            </p>
          </section>

          <div className="border-t pt-6">
            <a href="/watch/map" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View live map →
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
