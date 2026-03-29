// apps/admin/src/app/data-sources/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DataSource {
  id: string;
  name: string;
  type: string;
  parser_type: string;
  enabled: boolean;
  schedule: string | null;
  last_run_at: string | null;
  last_status: string | null;
  has_credentials: boolean;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="badge badge-neutral">Never run</span>;
  if (status.startsWith('ok')) return <span className="badge badge-success text-xs">{status}</span>;
  return <span className="badge badge-error text-xs">{status}</span>;
}

function EnabledToggle({ id, enabled, onToggle }: { id: string; enabled: boolean; onToggle: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      await fetch(`/api/data-sources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      onToggle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`btn btn-xs ${enabled ? 'btn-success' : 'btn-ghost border border-base-300'}`}
    >
      {loading ? '…' : enabled ? 'Enabled' : 'Disabled'}
    </button>
  );
}

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runResults, setRunResults] = useState<Record<string, string>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: '', parser_type: '', schedule: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/data-sources');
    const json = await res.json();
    setSources(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRun = async (id: string) => {
    setRunningId(id);
    setRunResults(prev => ({ ...prev, [id]: 'Running…' }));
    try {
      const res = await fetch(`/api/data-sources/${id}/run`, { method: 'POST' });
      const json = await res.json();
      if (json.data?.success) {
        setRunResults(prev => ({ ...prev, [id]: `✓ ${json.data.records_ingested} records ingested` }));
      } else {
        setRunResults(prev => ({ ...prev, [id]: `✗ ${json.data?.error ?? json.error ?? 'Failed'}` }));
      }
      load();
    } catch {
      setRunResults(prev => ({ ...prev, [id]: '✗ Network error' }));
    } finally {
      setRunningId(null);
    }
  };

  const handleAdd = async () => {
    if (!form.name || !form.type || !form.parser_type) return;
    setSaving(true);
    await fetch('/api/data-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowAdd(false);
    setForm({ name: '', type: '', parser_type: '', schedule: '' });
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Sources</h1>
          <p className="text-base-content/60 text-sm mt-0.5">Manage vehicle data sources and trigger manual runs.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(v => !v)}>
          {showAdd ? 'Cancel' : '+ Add Source'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card bg-base-200 p-5 space-y-3">
          <h2 className="font-semibold text-sm">New Data Source</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input input-bordered input-sm"
              placeholder="Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <input
              className="input input-bordered input-sm"
              placeholder="Type (e.g. web, file, api)"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            />
            <input
              className="input input-bordered input-sm"
              placeholder="Parser type (matches adapter filename)"
              value={form.parser_type}
              onChange={e => setForm(f => ({ ...f, parser_type: e.target.value }))}
            />
            <input
              className="input input-bordered input-sm"
              placeholder="Schedule (cron, optional)"
              value={form.schedule}
              onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={saving}>
            {saving ? 'Saving…' : 'Create'}
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-base-content/40">Loading…</div>
      ) : sources.length === 0 ? (
        <div className="text-center py-12 text-base-content/40">No data sources configured yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-300">
          <table className="table table-sm w-full">
            <thead>
              <tr className="bg-base-200 text-xs uppercase tracking-wide">
                <th>Name</th>
                <th>Type</th>
                <th>Parser</th>
                <th>Schedule</th>
                <th>Last Run</th>
                <th>Status</th>
                <th>Enabled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sources.map(s => (
                <tr key={s.id} className="hover:bg-base-100">
                  <td>
                    <Link href={`/data-sources/${s.id}`} className="font-medium link link-hover">
                      {s.name}
                    </Link>
                    {s.has_credentials && (
                      <span className="ml-1 text-xs text-base-content/40">🔑</span>
                    )}
                  </td>
                  <td className="text-sm text-base-content/70">{s.type}</td>
                  <td><code className="text-xs bg-base-300 px-1.5 py-0.5 rounded">{s.parser_type}</code></td>
                  <td className="text-xs text-base-content/60">{s.schedule ?? '—'}</td>
                  <td className="text-xs text-base-content/60">
                    {s.last_run_at ? new Date(s.last_run_at).toLocaleString() : '—'}
                  </td>
                  <td>
                    <div className="space-y-0.5">
                      <StatusBadge status={s.last_status} />
                      {runResults[s.id] && (
                        <div className={`text-xs ${runResults[s.id].startsWith('✓') ? 'text-success' : 'text-error'}`}>
                          {runResults[s.id]}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <EnabledToggle id={s.id} enabled={s.enabled} onToggle={load} />
                  </td>
                  <td>
                    <button
                      className="btn btn-xs btn-outline"
                      disabled={runningId === s.id || !s.enabled}
                      onClick={() => handleRun(s.id)}
                    >
                      {runningId === s.id ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : 'Run now'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
