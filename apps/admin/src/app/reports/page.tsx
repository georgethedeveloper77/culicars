// apps/admin/src/app/reports/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { RiskBadge, ReportStatusBadge } from '@/components/ui/StatusBadge';
import type { Report } from '@/types/admin.types';

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Report[]>('/reports')
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      key: 'vin',
      header: 'Vehicle',
      render: (r: Report) => (
        <div>
          <p className="font-medium">
            {r.vehicle?.make} {r.vehicle?.model} {r.vehicle?.year}
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">{r.vin}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: Report) => <ReportStatusBadge status={r.status} />,
      width: '100px',
    },
    {
      key: 'risk',
      header: 'Risk',
      render: (r: Report) => (
        <div className="flex items-center gap-2">
          <RiskBadge level={r.riskLevel} />
          <span className="text-xs text-zinc-500">{r.riskScore}/100</span>
        </div>
      ),
      width: '160px',
    },
    {
      key: 'recommendation',
      header: 'Recommendation',
      render: (r: Report) => (
        <span className="text-sm capitalize">{r.recommendation?.toLowerCase()}</span>
      ),
      width: '120px',
    },
    {
      key: 'sources',
      header: 'Sources',
      render: (r: Report) => (
        <span className="text-sm text-zinc-400">
          {r.sourcesChecked} checked · {r.recordsFound} found
        </span>
      ),
    },
    {
      key: 'generated',
      header: 'Generated',
      render: (r: Report) => (
        <span className="text-sm text-zinc-500">
          {r.generatedAt ? new Date(r.generatedAt).toLocaleDateString() : '—'}
        </span>
      ),
      width: '120px',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Reports"
        description={`${reports.length} total reports`}
      />
      <DataTable
        columns={columns as any}
        data={reports as any}
        loading={loading}
        emptyMessage="No reports found."
        onRowClick={(r: any) => router.push(`/reports/${r.id}`)}
      />
    </div>
  );
}
