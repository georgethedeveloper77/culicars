'use client';
// apps/admin/src/app/watch/queue/page.tsx

import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPatch } from '@/lib/api';

type AlertStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'disputed'
  | 'needs_more_info'
  | 'archived';

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
  vin: string | null;
  type: AlertType;
  lat: number | null;
  lng: number | null;
  location_name: string | null;
  description: string;
  status: AlertStatus;
  submitted_by: string | null;
  moderated_by: string | null;
  moderation_note: string | null;
  moderated_at: string | null;
  evidence_urls: string[];
  created_at: string;
}

interface PaginatedAlerts {
  alerts: WatchAlert[];
  total: number;
  page: number;
  pages: number;
}

const TYPE_LABELS: Record<AlertType, string> = {
  stolen_vehicle: 'Stolen Vehicle',
  recovered_vehicle: 'Recovered',
  damage: 'Damage',
  vandalism: 'Vandalism',
  parts_theft: 'Parts Theft',
  suspicious_activity: 'Suspicious Activity',
  hijack: 'Hijack',
};

const TYPE_COLORS: Record<AlertType, string> = {
  stolen_vehicle: 'bg-red-100 text-red-800',
  recovered_vehicle: 'bg-green-100 text-green-800',
  damage: 'bg-orange-100 text-orange-800',
  vandalism: 'bg-yellow-100 text-yellow-800',
  parts_theft: 'bg-purple-100 text-purple-800',
  suspicious_activity: 'bg-blue-100 text-blue-800',
  hijack: 'bg-red-200 text-red-900',
};

const STATUS_COLORS: Record<AlertStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  disputed: 'bg-purple-100 text-purple-800',
  needs_more_info: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-600',
};

const MODERATION_ACTIONS: { status: AlertStatus; label: string; className: string }[] = [
  { status: 'approved', label: 'Approve', className: 'bg-green-600 hover:bg-green-700 text-white' },
  { status: 'rejected', label: 'Reject', className: 'bg-red-600 hover:bg-red-700 text-white' },
  { status: 'needs_more_info', label: 'Needs Info', className: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { status: 'disputed', label: 'Mark Disputed', className: 'bg-purple-600 hover:bg-purple-700 text-white' },
  { status: 'archived', label: 'Archive', className: 'bg-gray-600 hover:bg-gray-700 text-white' },
];

export default function WatchQueuePage() {
  const [data, setData] = useState<PaginatedAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AlertStatus | ''>('pending');
  const [filterType, setFilterType] = useState<AlertType | ''>('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<WatchAlert | null>(null);
  const [moderating, setModerating] = useState(false);
  const [note, setNote] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState('');

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);

      const res = await apiGet<any>(`/watch/admin/queue?${params}`);
      setData(res.data.data);
    } catch {
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType]);

  const fetchPendingCount = async () => {
    try {
      const res = await apiGet<any>('/watch/admin/pending-count'); // typed
      setPendingCount(res.data.data.count);
    } catch {}
  };

  useEffect(() => {
    fetchAlerts();
    fetchPendingCount();
  }, [fetchAlerts]);

  const moderate = async (status: AlertStatus) => {
    if (!selected) return;
    setModerating(true);
    try {
      await apiPatch<any>(`/watch/alerts/${selected.id}/moderate`, {
        status,
        moderationNote: note || undefined,
      });
      setSelected(null);
      setNote('');
      fetchAlerts();
      fetchPendingCount();
    } catch {
      setError('Moderation failed. Try again.');
    } finally {
      setModerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Watch Queue</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Community vehicle and area alerts pending moderation
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
              {pendingCount} pending
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value as AlertStatus | ''); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="disputed">Disputed</option>
            <option value="needs_more_info">Needs Info</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value as AlertType | ''); setPage(1); }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading alerts…</div>
          ) : !data || data.alerts.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No alerts match your filters</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Plate / Location</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.alerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded-md ${TYPE_COLORS[alert.type]}`}>
                        {TYPE_LABELS[alert.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700">
                      {alert.plate ? (
                        <span className="font-semibold">{alert.plate}</span>
                      ) : alert.location_name ? (
                        <span className="text-gray-500 font-sans">{alert.location_name}</span>
                      ) : (
                        <span className="text-gray-400 font-sans">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      <span className="line-clamp-2">{alert.description}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded-md ${STATUS_COLORS[alert.status]}`}>
                        {alert.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(alert.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelected(alert); setNote(''); }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              {data.total} total · Page {data.page} of {data.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Review Alert</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Alert details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Type</span>
                  <p className="font-medium text-gray-900 mt-0.5">{TYPE_LABELS[selected.type]}</p>
                </div>
                {selected.plate && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Plate</span>
                    <p className="font-mono font-semibold text-gray-900 mt-0.5">{selected.plate}</p>
                  </div>
                )}
                {selected.vin && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide">VIN</span>
                    <p className="font-mono text-gray-900 mt-0.5">{selected.vin}</p>
                  </div>
                )}
                {selected.location_name && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Location</span>
                    <p className="text-gray-900 mt-0.5">{selected.location_name}</p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide">Description</span>
                <p className="text-gray-800 mt-1 text-sm leading-relaxed">{selected.description}</p>
              </div>

              {selected.evidence_urls.length > 0 && (
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Evidence</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selected.evidence_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-xs hover:underline"
                      >
                        View file {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-gray-400 text-xs uppercase tracking-wide block mb-1">
                  Moderation note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={2}
                  placeholder="Reason for rejection, what extra info is needed, etc."
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap gap-2">
              {MODERATION_ACTIONS.map(action => (
                <button
                  key={action.status}
                  onClick={() => moderate(action.status)}
                  disabled={moderating}
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${action.className}`}
                >
                  {moderating ? '…' : action.label}
                </button>
              ))}
              <button
                onClick={() => setSelected(null)}
                className="ml-auto text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
