'use client';
// apps/web/src/app/report-stolen/[plate]/page.tsx

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { StolenReportForm } from '@/components/stolen/StolenReportForm';
import { StolenReportSuccess } from '@/components/stolen/StolenReportSuccess';
import { RecoveryReportForm } from '@/components/stolen/RecoveryReportForm';
import { Suspense } from 'react';

function PlateReportContent() {
  const { plate } = useParams<{ plate: string }>();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');
  const reportId = searchParams.get('reportId') || '';

  const decodedPlate = decodeURIComponent(plate || '').toUpperCase();
  const [successId, setSuccessId] = useState<string | null>(null);
  const [recovered, setRecovered] = useState(false);

  if (recovered) {
    return (
      <div className="max-w-md mx-auto py-12 text-center cc-card p-8">
        <span className="text-4xl block mb-3">✓</span>
        <h2 className="text-xl font-bold text-cc-text mb-2">Recovery reported</h2>
        <p className="text-cc-muted text-sm">
          The stolen report for <span className="font-mono font-semibold text-cc-text">{decodedPlate}</span> has been
          updated. The community will be notified.
        </p>
      </div>
    );
  }

  if (successId) {
    return <StolenReportSuccess plate={decodedPlate} reportId={successId} />;
  }

  if (action === 'recover' && reportId) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-cc-text mb-2">Mark Vehicle as Recovered</h1>
          <p className="text-cc-muted">
            Submit a recovery report for{' '}
            <span className="font-mono font-semibold text-cc-text">{decodedPlate}</span>
          </p>
        </div>
        <div className="cc-card p-6">
          <RecoveryReportForm
            reportId={reportId}
            plate={decodedPlate}
            onSuccess={() => setRecovered(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🚨</span>
          <h1 className="text-2xl font-bold text-cc-text">Report Stolen Vehicle</h1>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="plate-badge text-base">{decodedPlate}</span>
          <span className="text-cc-muted text-sm">Pre-filled from your search</span>
        </div>
      </div>

      <StolenReportForm
        defaultPlate={decodedPlate}
        onSuccess={id => setSuccessId(id)}
      />
    </div>
  );
}

export default function PlateStolenPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-cc-border border-t-cc-accent animate-spin" /></div>}>
        <PlateReportContent />
      </Suspense>
    </div>
  );
}
