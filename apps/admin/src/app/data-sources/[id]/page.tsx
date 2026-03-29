// apps/admin/src/app/data-sources/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  created_at: string;
}

export default function DataSourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [source, setSource] = useState<DataSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<DataSource & { credentials: string }>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/data-sources/${id}`);
    if (!res.ok) { router.push('/data-sources'); return; }
    const json = await res.json();
    setSource(json.data);
    setForm({
      name: json.data.name,
      type: json.data.type,
      parser_type: json.data.parser_type,
      schedule: json.data.schedule ?? '',
      enabled: json.data.enabled,
      credentials: '',
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleRun = async () => {
    setRunning(true);
    setRunResult('Running…');
    const res = await fetch(`/api/data-sources/${id}/run`, { method: 'POST' });
    const json = await res.json();
    if (json.data?.success) {
      setRunResult(`✓ ${json.data.records_ingested} records ingested at ${new Date(json.data.ran_at).toLocaleTimeString()}`);
    } else {
      setRunResult(`✗ ${json.data?.error ?? json.error ?? 'Unknown error'}`);
    }
    setRunning(false);
    load();
  };

  const handleSave = async () => {
    setSaving(true);
    const body: any = {
      name: form.name,
      type: form.type,
      parser_type: form.parser_type,
      schedule: form.schedule || null,
      enabled: form.enabled,
    };
    // Only send credentials if the admin filled in the field
    if (form.credentials && form.credentials.trim()) {
      try {
        body.credentials = JSON.parse(form.credentials);
      } catch {
        alert('Credentials must be valid JSON');
        setSaving(false);
        return;
      }
    }
    await fetch(`/api/data-sources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setEditing(false);
    load();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${source?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/data-sources/${id}`, { method: 'DELETE' });
    router.push('/data-sources');
  };

  if (loading) {
    return <div className="p-6 text-base-content/40">Loading…</div>;
  }
  if (!source) return null;

  const statusOk = source.last_status?.startsWith('ok');

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Back */}
      <Link href="/data-sources" className="text-sm link link-hover text-base-content/60">
        ← Data Sources
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{source.name}</h1>
          <p className="text-base-content/50 text-sm mt-0.5">
            Created {new Date(source.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setEditing(v => !v)}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleRun}
            disabled={running || !source.enabled}
          >
            {running ? <span className="loading loading-spinner loading-xs" /> : 'Run now'}
          </button>
        </div>
      </div>

      {/* Run result banner */}
      {runResult && (
        <div className={`alert ${runResult.startsWith('✓') ? 'alert-success' : 'alert-error'} py-2 text-sm`}>
          {runResult}
        </div>
      )}

      {/* Health card */}
      <div className="card bg-base-200 p-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-base-content/50 text-xs mb-0.5">Last run</div>
          <div>{source.last_run_at ? new Date(source.last_run_at).toLocaleString() : 'Never'}</div>
        </div>
        <div>
          <div className="text-base-content/50 text-xs mb-0.5">Last status</div>
          <div className={statusOk ? 'text-success' : source.last_status ? 'text-error' : ''}>
            {source.last_status ?? '—'}
          </div>
        </div>
        <div>
          <div className="text-base-content/50 text-xs mb-0.5">Schedule</div>
          <div>{source.schedule ?? 'Manual only'}</div>
        </div>
        <div>
          <div className="text-base-content/50 text-xs mb-0.5">Credentials</div>
          <div>{source.has_credentials ? '🔑 Stored (encrypted)' : 'None'}</div>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card bg-base-200 p-5 space-y-4">
          <h2 className="font-semibold text-sm">Edit Source</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-xs text-base-content/60">Name</span>
              <input
                className="input input-bordered input-sm w-full"
                value={form.name ?? ''}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-base-content/60">Type</span>
              <input
                className="input input-bordered input-sm w-full"
                value={form.type ?? ''}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-base-content/60">Parser type</span>
              <input
                className="input input-bordered input-sm w-full"
                value={form.parser_type ?? ''}
                onChange={e => setForm(f => ({ ...f, parser_type: e.target.value }))}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-base-content/60">Schedule (cron)</span>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="e.g. 0 2 * * *"
                value={form.schedule ?? ''}
                onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))}
              />
            </label>
          </div>

          {/* Credentials — write-only */}
          <label className="space-y-1 block">
            <span className="text-xs text-base-content/60">
              Credentials (JSON) — leave blank to keep existing
            </span>
            <textarea
              className="textarea textarea-bordered text-xs w-full font-mono"
              rows={4}
              placeholder={'{\n  "api_key": "...",\n  "base_url": "..."\n}'}
              value={form.credentials ?? ''}
              onChange={e => setForm(f => ({ ...f, credentials: e.target.value }))}
            />
            <p className="text-xs text-base-content/40">
              Stored encrypted. Never returned in API responses.
            </p>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-success"
              checked={form.enabled ?? true}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
            />
            <span className="text-sm">Enabled</span>
          </label>

          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              className="btn btn-error btn-outline btn-sm ml-auto"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete source'}
            </button>
          </div>
        </div>
      )}

      {/* Config summary (read-only) */}
      {!editing && (
        <div className="card bg-base-200 p-5 text-sm space-y-2">
          <h2 className="font-semibold text-xs text-base-content/50 uppercase tracking-wide mb-2">Configuration</h2>
          <div className="flex gap-2">
            <span className="text-base-content/50 w-28">Type</span>
            <span>{source.type}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-base-content/50 w-28">Parser type</span>
            <code className="text-xs bg-base-300 px-1.5 py-0.5 rounded">{source.parser_type}</code>
          </div>
          <div className="flex gap-2">
            <span className="text-base-content/50 w-28">Enabled</span>
            <span className={source.enabled ? 'text-success' : 'text-base-content/40'}>
              {source.enabled ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
