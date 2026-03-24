// apps/admin/src/app/scraper/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { JobStatusBadge } from '@/components/ui/StatusBadge';
import { ScraperTrigger } from '@/components/scraper/ScraperTrigger';
import type { ScraperJob } from '@/types/admin.types';

function duration(start?: string, end?: string) {
  if (!start) return '—';
  const ms = new Date(end ?? Date.now()).getTime() - new Date(start).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function ScraperPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ScraperJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiGet<ScraperJob[]>('/admin/scraper/jobs')
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns = [
    {
      key: 'source',
      header: 'Source',
      render: (j: ScraperJob) => (
        <span className="font-mono text-sm font-semibold text-zinc-200">
          {j.source.replace(/_/g, ' ')}
        </span>
      ),
      width: '160px',
    },
    {
      key: 'status',
      header: 'Status',
      render: (j: ScraperJob) => <JobStatusBadge status={j.status} />,
      width: '110px',
    },
    {
      key: 'trigger',
      header: 'Trigger',
      render: (j: ScraperJob) => (
        <span className="text-xs text-zinc-500 capitalize">{j.trigger}</span>
      ),
      width: '90px',
    },
    {
      key: 'items',
      header: 'Items',
      render: (j: ScraperJob) => (
        <div className="text-sm">
          <span className="text-emerald-400">{j.itemsFound}</span>
          <span className="text-zinc-600"> / </span>
          <span className="text-zinc-400">{j.itemsStored} stored</span>
          {j.itemsSkipped > 0 && (
            <span className="text-zinc-600"> / {j.itemsSkipped} skip</span>
          )}
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (j: ScraperJob) => (
        <span className="text-sm text-zinc-400">{duration(j.startedAt, j.completedAt)}</span>
      ),
      width: '90px',
    },
    {
      key: 'error',
      header: 'Error',
      render: (j: ScraperJob) => (
        j.errorLog
          ? <span className="text-xs text-red-400 truncate max-w-[200px] block">{j.errorLog.slice(0, 80)}</span>
          : <span className="text-zinc-600">—</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (j: ScraperJob) => (
        <span className="text-sm text-zinc-500">{new Date(j.createdAt).toLocaleString()}</span>
      ),
      width: '170px',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Scraper Jobs"
        description="Data ingestion from 12 sources"
        actions={
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/6 hover:bg-white/10 text-sm text-zinc-300 border border-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        }
      />

      <div className="mb-6">
        <ScraperTrigger onJobCreated={(job) => setJobs((prev) => [job, ...prev])} />
      </div>

      <DataTable
        columns={columns as any}
        data={jobs as any}
        loading={loading}
        emptyMessage="No scraper jobs yet."
        onRowClick={(j: any) => router.push(`/scraper/${j.id}`)}
      />
    </div>
  );
}
