// apps/admin/src/app/contributions/queue/page.tsx
'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

type Status = 'approved' | 'rejected' | 'needs_more_info' | 'archived';

interface Contribution {
  id: string;
  plate: string;
  type: string;
  status: string;
  dataJson: Record<string, any>;
  evidenceUrls: string[];
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  odometer: 'Odometer',
  service_record: 'Service record',
  damage: 'Damage',
  listing_photo: 'Listing / photo',
};

export default function ContributionsQueuePage() {
  const [items, setItems] = useState<Contribution[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/contributions/pending?limit=50`, { credentials: 'include' });
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function moderate(id: string, status: Status, note?: string) {
    setModeratingId(id);
    try {
      await fetch(`${API}/contributions/${id}/moderate`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, moderatorNote: note }),
      });
      await load();
    } finally {
      setModeratingId(null);
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground text-sm">Loading…</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-foreground">Contributions queue</h1>
        <span className="text-sm text-muted-foreground">{total} pending</span>
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No contributions pending review.
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-medium text-foreground text-sm">{item.plate}</span>
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                    {STATUS_LABELS[item.type] ?? item.type}
                  </span>
                </div>
                <pre className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 overflow-x-auto mt-2 max-h-32">
                  {JSON.stringify(item.dataJson, null, 2)}
                </pre>
                {item.evidenceUrls.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.evidenceUrls.length} evidence file(s) attached
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                disabled={moderatingId === item.id}
                onClick={() => moderate(item.id, 'approved')}
                className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Approve
              </button>
              <button
                disabled={moderatingId === item.id}
                onClick={() => moderate(item.id, 'rejected', 'Does not meet contribution standards')}
                className="px-3 py-1.5 text-xs font-medium bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
              <button
                disabled={moderatingId === item.id}
                onClick={() => moderate(item.id, 'needs_more_info')}
                className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted/50 disabled:opacity-50 transition-colors"
              >
                Need more info
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
