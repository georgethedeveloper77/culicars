// apps/admin/src/app/contributions/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { ContribStatusBadge } from '@/components/ui/StatusBadge';
import { ModerationActions } from '@/components/contributions/ModerationActions';
import type { Contribution, ContribStatus } from '@/types/admin.types';

export default function ContributionDetailPage({ params }: { params: { id: string } }) {
  const [contrib, setContrib] = useState<Contribution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Contribution>(`/contributions/${params.id}`)
      .then(setContrib)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  function handleUpdate(newStatus: ContribStatus, note: string) {
    setContrib((prev) => prev ? { ...prev, status: newStatus, adminNote: note } : prev);
  }

  if (loading) {
    return <div className="h-64 bg-white/4 rounded-xl animate-pulse" />;
  }
  if (!contrib) {
    return <div className="text-zinc-500">Contribution not found.</div>;
  }

  return (
    <div>
      <Link
        href="/contributions"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Contributions
      </Link>

      <PageHeader
        title={contrib.title}
        description={`${contrib.type.replace(/_/g, ' ')} · VIN: ${contrib.vin}`}
        actions={<ContribStatusBadge status={contrib.status} />}
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Details */}
          <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Type</dt>
                <dd className="text-zinc-200 font-mono text-xs">{contrib.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">VIN</dt>
                <dd className="text-zinc-200 font-mono text-xs">{contrib.vin}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Submitter</dt>
                <dd className="text-zinc-200">{contrib.user?.email ?? 'Anonymous'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Confidence</dt>
                <dd className="text-zinc-200">
                  {contrib.confidenceScore != null
                    ? `${(contrib.confidenceScore * 100).toFixed(0)}%`
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Submitted</dt>
                <dd className="text-zinc-200">{new Date(contrib.createdAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          {/* Description */}
          {contrib.description && (
            <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Description</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{contrib.description}</p>
            </div>
          )}

          {/* Evidence files */}
          {(contrib.evidenceUrls ?? []).length > 0 && (
            <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Evidence ({contrib.evidenceUrls!.length})</h3>
              <div className="space-y-2">
                {contrib.evidenceUrls!.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#D4A843] hover:text-[#E8C060] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Evidence file {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin note display */}
          {contrib.adminNote && (
            <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">Admin Note</h3>
              <p className="text-sm text-zinc-400">{contrib.adminNote}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <ModerationActions
            contributionId={contrib.id!}
            currentStatus={contrib.status}
            onUpdate={handleUpdate}
          />
        </div>
      </div>
    </div>
  );
}
