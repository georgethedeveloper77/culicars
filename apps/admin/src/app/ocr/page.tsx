// apps/admin/src/app/ocr/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { OcrScan } from '@/types/admin.types';

const DOC_TYPE_LABELS: Record<string, string> = {
  logbook: 'Logbook',
  import_doc: 'Import Doc',
  dashboard: 'Dashboard',
  plate_photo: 'Plate Photo',
  ntsa_cor: 'NTSA COR',
};

export default function OcrPage() {
  const [scans, setScans] = useState<OcrScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<OcrScan[]>('/admin/ocr/scans')
      .then(setScans)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      key: 'docType',
      header: 'Document Type',
      render: (s: OcrScan) => (
        <span className="text-xs font-medium px-2 py-1 rounded-md bg-white/6 text-zinc-300">
          {DOC_TYPE_LABELS[s.documentType] ?? s.documentType}
        </span>
      ),
      width: '140px',
    },
    {
      key: 'plate',
      header: 'Extracted Plate',
      render: (s: OcrScan) => (
        <span className="font-mono text-zinc-200">{s.extractedPlate ?? '—'}</span>
      ),
      width: '140px',
    },
    {
      key: 'vin',
      header: 'Extracted VIN',
      render: (s: OcrScan) => (
        <span className="font-mono text-xs text-zinc-400">{s.extractedVin ?? '—'}</span>
      ),
    },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (s: OcrScan) => {
        const pct = s.confidence != null ? Math.round(s.confidence * 100) : null;
        const color = pct == null ? 'text-zinc-500' : pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400';
        return <span className={`text-sm font-semibold ${color}`}>{pct != null ? `${pct}%` : '—'}</span>;
      },
      width: '110px',
    },
    {
      key: 'source',
      header: 'Source',
      render: (s: OcrScan) => (
        <span className="text-xs text-zinc-500 capitalize">{s.source.replace(/_/g, ' ')}</span>
      ),
      width: '140px',
    },
    {
      key: 'user',
      header: 'User',
      render: (s: OcrScan) => (
        <span className="text-sm text-zinc-400">{s.user?.email ?? 'Anonymous'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Scanned',
      render: (s: OcrScan) => (
        <span className="text-sm text-zinc-500">{new Date(s.createdAt).toLocaleString()}</span>
      ),
      width: '170px',
    },
  ];

  const ntsaCount = scans.filter((s) => s.source === 'ntsa_cor_auto').length;
  const avgConf =
    scans.length > 0
      ? Math.round((scans.reduce((a, s) => a + (s.confidence ?? 0), 0) / scans.length) * 100)
      : 0;

  return (
    <div>
      <PageHeader
        title="OCR Scans"
        description="All document scans processed through the OCR pipeline"
      />

      {/* Quick stats */}
      <div className="flex gap-4 mb-6">
        {[
          { label: 'Total Scans', value: scans.length },
          { label: 'NTSA COR Auto-Fetches', value: ntsaCount },
          { label: 'Avg Confidence', value: `${avgConf}%` },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="px-5 py-3 rounded-xl border border-white/8 bg-[#141414] flex items-center gap-3"
          >
            <span className="text-xs text-zinc-500">{label}</span>
            <span className="text-lg font-bold text-zinc-100">{value}</span>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns as any}
        data={scans as any}
        loading={loading}
        emptyMessage="No OCR scans yet."
      />
    </div>
  );
}
