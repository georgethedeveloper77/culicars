// apps/admin/src/app/stolen-reports/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StolenStatusBadge } from '@/components/ui/StatusBadge';
import type { StolenReport, StolenStatus } from '@/types/admin.types';

const STATUSES: Array<StolenStatus | 'all'> = ['all', 'pending', 'active', 'recovered', 'rejected', 'duplicate'];

export default function StolenReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = (searchParams.get('status') ?? 'pending') as StolenStatus | 'all';

  const [reports, setReports] = useState<StolenReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    apiGet<StolenReport[]>(`/stolen-reports${qs}`)
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const columns = [
    {
      key: 'plate',
      header: 'Plate',
      render: (r: StolenReport) => (
        <div>
          <span className="font-bold font-mono text-zinc-100">{r.plateDisplay ?? r.plate}</span>
          {r.isObVerified && (
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">OB✓</span>
          )}
          {r.vin && <p className="text-xs font-mono text-zinc-500 mt-0.5">{r.vin}</p>}
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (r: StolenReport) => (
        <span className="text-sm text-zinc-300">{r.countyStolen}, {r.townStolen}</span>
      ),
    },
    {
      key: 'dateStolenString',
      header: 'Date Stolen',
      render: (r: StolenReport) => (
        <span className="text-sm text-zinc-400">{r.dateStolenString}</span>
      ),
      width: '120px',
    },
    {
      key: 'obNumber',
      header: 'OB Number',
      render: (r: StolenReport) => (
        <span className="text-sm font-mono text-zinc-400">{r.policeObNumber ?? '—'}</span>
      ),
      width: '140px',
    },
    {
      key: 'reporterType',
      header: 'Reporter',
      render: (r: StolenReport) => (
        <span className="text-sm text-zinc-400 capitalize">{r.reporterType}</span>
      ),
      width: '100px',
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: StolenReport) => <StolenStatusBadge status={r.status} />,
      width: '110px',
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      render: (r: StolenReport) => (
        <span className="text-sm text-zinc-500">{new Date(r.createdAt).toLocaleDateString()}</span>
      ),
      width: '110px',
    },
  ];

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  return (
    <div>
      <PageHeader
        title="Stolen Reports"
        description="Community vehicle theft reports — review and approve"
        actions={
          pendingCount > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-red-400">{pendingCount} pending</span>
            </div>
          ) : undefined
        }
      />

      {/* Status filter */}
      <div className="flex gap-1 mb-6 bg-white/4 rounded-lg p-1 w-fit flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() =>
              router.push(s === 'all' ? '/stolen-reports' : `/stolen-reports?status=${s}`)
            }
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
              statusFilter === s
                ? 'bg-[#D4A843] text-black'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns as any}
        data={reports as any}
        loading={loading}
        emptyMessage="No stolen reports found."
        onRowClick={(r: any) => router.push(`/stolen-reports/${r.id}`)}
      />
    </div>
  );
}
