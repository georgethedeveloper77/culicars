// apps/admin/src/app/watch/insights/page.tsx
'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

interface Insights {
  hotspots: { area: string; count: number }[];
  alertTypes: { type: string; count: number }[];
  recentCount: number;
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

export default function AdminWatchInsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/watch/insights`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-500 text-sm">Loading insights…</div>;
  if (!data) return <div className="p-8 text-red-500 text-sm">Failed to load insights.</div>;

  const maxType = data.alertTypes[0]?.count ?? 1;

  return (
    <div className="p-8 max-w-3xl space-y-10">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Watch Insights</h1>
        <p className="text-sm text-gray-500 mt-1">Operational view — approved community alerts.</p>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Alerts last 30 days" value={String(data.recentCount)} />
        <StatCard label="Alert types tracked" value={String(data.alertTypes.length)} />
        <StatCard label="Active hotspot areas" value={String(data.hotspots.length)} />
      </div>

      {/* Alert type breakdown */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
          Alert breakdown
        </h2>
        <div className="space-y-3">
          {data.alertTypes.map((item) => {
            const pct = Math.round((item.count / maxType) * 100);
            return (
              <div key={item.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300">
                    {ALERT_LABELS[item.type] ?? item.type}
                  </span>
                  <span className="text-gray-500 tabular-nums font-medium">{item.count}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hotspot areas */}
      {data.hotspots.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
            Top hotspot areas
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">Coordinates (lat,lng)</th>
                <th className="pb-2 font-medium text-right">Alerts</th>
              </tr>
            </thead>
            <tbody>
              {data.hotspots.map((h) => (
                <tr key={h.area} className="border-b last:border-0">
                  <td className="py-2 text-gray-700 dark:text-gray-300 font-mono text-xs">{h.area}</td>
                  <td className="py-2 text-right text-gray-900 dark:text-white font-semibold">{h.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
