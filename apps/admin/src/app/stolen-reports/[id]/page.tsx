// apps/admin/src/app/stolen-reports/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { StolenStatusBadge } from '@/components/ui/StatusBadge';
import { StolenReportCard } from '@/components/stolen/StolenReportCard';
import { StolenReviewActions } from '@/components/stolen/StolenReviewActions';
import type { StolenReport, StolenStatus } from '@/types/admin.types';

export default function StolenReportDetailPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<StolenReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<StolenReport>(`/stolen-reports/${params.id}`)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  function handleUpdate(newStatus: StolenStatus, note: string) {
    setReport((prev) =>
      prev ? { ...prev, status: newStatus, adminNote: note } : prev
    );
  }

  if (loading) {
    return <div className="h-64 bg-white/4 rounded-xl animate-pulse" />;
  }
  if (!report) {
    return <div className="text-zinc-500">Stolen report not found.</div>;
  }

  return (
    <div>
      <Link
        href="/stolen-reports"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Stolen Reports
      </Link>

      <PageHeader
        title={`Stolen Report — ${report.plateDisplay ?? report.plate}`}
        description={`Submitted ${new Date(report.createdAt).toLocaleString()}`}
        actions={<StolenStatusBadge status={report.status} />}
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Main */}
        <div className="col-span-2 space-y-6">
          <StolenReportCard report={report} />

          {/* OB Verification helper */}
          <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Verification Checklist</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Plate format valid', ok: /^[A-Z]{3}\d{3}[A-Z]?$/.test(report.plate) },
                { label: 'OB number provided', ok: !!report.policeObNumber },
                { label: 'Contact info provided', ok: !!(report.contactPhone || report.contactEmail) },
                { label: 'Police station named', ok: !!report.policeStation },
                { label: 'VIN provided (higher trust)', ok: !!report.vin },
              ].map(({ label, ok }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-500'
                  }`}>
                    {ok ? '✓' : '—'}
                  </span>
                  <span className={ok ? 'text-zinc-300' : 'text-zinc-500'}>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Photos */}
          {(report as any).photoUrls?.length > 0 && (
            <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                Owner Photos ({(report as any).photoUrls.length})
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(report as any).photoUrls.map((url: string, i: number) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-video rounded-lg bg-zinc-800 overflow-hidden group relative"
                  >
                    <img
                      src={url}
                      alt={`Evidence ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin note */}
          {report.adminNote && (
            <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">Admin Note</h3>
              <p className="text-sm text-zinc-400">{report.adminNote}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <StolenReviewActions
            reportId={report.id!}
            currentStatus={report.status}
            onUpdate={handleUpdate}
          />
        </div>
      </div>
    </div>
  );
}
