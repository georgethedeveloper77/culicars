// apps/admin/src/app/contributions/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { ContribStatusBadge } from '@/components/ui/StatusBadge';
import type { Contribution, ContribStatus } from '@/types/admin.types';

const STATUSES: Array<ContribStatus | 'all'> = ['all', 'pending', 'approved', 'rejected', 'flagged'];

export default function ContributionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = (searchParams.get('status') ?? 'pending') as ContribStatus | 'all';

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    apiGet<Contribution[]>(`/contributions${qs}`)
      .then(setContributions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (c: Contribution) => (
        <span className="text-xs font-mono text-zinc-400">{c.type.replace(/_/g, ' ')}</span>
      ),
      width: '180px',
    },
    {
      key: 'title',
      header: 'Title',
      render: (c: Contribution) => (
        <div>
          <p className="font-medium text-zinc-200">{c.title}</p>
          {c.description && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-xs">{c.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'vin',
      header: 'VIN',
      render: (c: Contribution) => (
        <span className="text-xs font-mono text-zinc-400">{c.vin}</span>
      ),
      width: '180px',
    },
    {
      key: 'user',
      header: 'Submitter',
      render: (c: Contribution) => (
        <span className="text-sm text-zinc-400">{c.user?.email ?? 'Anonymous'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: Contribution) => <ContribStatusBadge status={c.status} />,
      width: '100px',
    },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (c: Contribution) => (
        <span className="text-sm text-zinc-400">
          {c.confidenceScore != null ? `${(c.confidenceScore * 100).toFixed(0)}%` : '—'}
        </span>
      ),
      width: '100px',
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      render: (c: Contribution) => (
        <span className="text-sm text-zinc-500">
          {new Date(c.createdAt).toLocaleDateString()}
        </span>
      ),
      width: '110px',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Contributions"
        description="User-submitted vehicle evidence"
      />

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-white/4 rounded-lg p-1 w-fit">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => router.push(s === 'all' ? '/contributions' : `/contributions?status=${s}`)}
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
        data={contributions as any}
        loading={loading}
        emptyMessage="No contributions found."
        onRowClick={(c: any) => router.push(`/contributions/${c.id}`)}
      />
    </div>
  );
}
