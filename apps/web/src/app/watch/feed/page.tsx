'use client';
// apps/web/src/app/watch/feed/page.tsx

import { useState, useEffect } from 'react';

type AlertType =
  | 'stolen_vehicle'
  | 'recovered_vehicle'
  | 'damage'
  | 'vandalism'
  | 'parts_theft'
  | 'suspicious_activity'
  | 'hijack';

interface WatchAlert {
  id: string;
  plate: string | null;
  type: AlertType;
  lat: number | null;
  lng: number | null;
  location_name: string | null;
  description: string;
  created_at: string;
  evidence_urls: string[];
}

interface FeedData {
  alerts: WatchAlert[];
  total: number;
  page: number;
  pages: number;
}

const TYPE_META: Record<AlertType, { label: string; emoji: string; color: string; bg: string }> = {
  stolen_vehicle:      { label: 'Stolen Vehicle',       emoji: '🚨', color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
  recovered_vehicle:   { label: 'Vehicle Recovered',    emoji: '✅', color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  damage:              { label: 'Vehicle Damage',        emoji: '💥', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  vandalism:           { label: 'Vandalism',             emoji: '⚠️', color: 'text-yellow-800', bg: 'bg-yellow-50 border-yellow-200' },
  parts_theft:         { label: 'Parts Theft',           emoji: '🔧', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  suspicious_activity: { label: 'Suspicious Activity',  emoji: '👁️', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  hijack:              { label: 'Hijack',                emoji: '🔴', color: 'text-red-900',    bg: 'bg-red-100 border-red-300' },
};

const FILTERS: { value: AlertType | ''; label: string }[] = [
  { value: '', label: 'All alerts' },
  { value: 'stolen_vehicle', label: 'Stolen' },
  { value: 'recovered_vehicle', label: 'Recovered' },
  { value: 'hijack', label: 'Hijack' },
  { value: 'parts_theft', label: 'Parts theft' },
  { value: 'suspicious_activity', label: 'Suspicious' },
  { value: 'vandalism', label: 'Vandalism' },
  { value: 'damage', label: 'Damage' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

export default function WatchFeedPage() {
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AlertType | ''>('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (filter) params.set('type', filter);
        const res = await fetch(`${API}/watch/alerts?${params}`);
        const json = await res.json();
        if (!json.success) throw new Error();
        setData(json.data);
      } catch {
        setError('Could not load the watch feed. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [filter, page]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Community Watch</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Community-reported vehicle alerts across Kenya. All alerts are reviewed before appearing here.
        </p>
      </div>

      {/* Report buttons */}
      <div className="flex gap-3 mb-6">
        <a
          href="/watch/report/vehicle"
          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl text-center transition-colors"
        >
          🚗 Report a vehicle
        </a>
        <a
          href="/watch/report/area"
          className="flex-1 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold py-2.5 px-4 rounded-xl text-center transition-colors"
        >
          📍 Report area activity
        </a>
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${
              filter === f.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      ) : !data || data.alerts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500 text-sm">No alerts match your filter.</p>
          <p className="text-gray-400 text-xs mt-1">Check back soon or be the first to report.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.alerts.map(alert => {
            const meta = TYPE_META[alert.type];
            return (
              <div key={alert.id} className={`border rounded-2xl p-4 ${meta.bg}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${meta.color}`}>
                        {meta.label}
                      </span>
                      {alert.plate && (
                        <span className="font-mono text-xs bg-white/70 px-2 py-0.5 rounded font-bold text-gray-900">
                          {alert.plate}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 text-sm mt-1 leading-relaxed line-clamp-3">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {alert.location_name && <span>📍 {alert.location_name}</span>}
                      <span>{timeAgo(alert.created_at)}</span>
                      {alert.evidence_urls.length > 0 && (
                        <span>{alert.evidence_urls.length} photo{alert.evidence_urls.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-40 hover:bg-gray-50"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-500 self-center">
            {page} / {data.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(data.pages, p + 1))}
            disabled={page === data.pages}
            className="text-sm px-4 py-2 border border-gray-300 rounded-xl disabled:opacity-40 hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}
    </main>
  );
}
