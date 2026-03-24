'use client';
// apps/web/src/app/report-stolen/page.tsx

import { useState } from 'react';
import { StolenReportForm } from '@/components/stolen/StolenReportForm';
import { StolenReportSuccess } from '@/components/stolen/StolenReportSuccess';

export default function ReportStolenPage() {
  const [successId, setSuccessId] = useState<string | null>(null);
  const [plate, setPlate] = useState('');

  if (successId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <StolenReportSuccess plate={plate} reportId={successId} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl">🚨</span>
          <h1 className="text-2xl font-bold text-cc-text">Report a Stolen Vehicle</h1>
        </div>
        <p className="text-cc-muted">
          Report free — no account required. Once reviewed and approved, a stolen alert will
          appear on <strong className="text-cc-text">every search for this plate</strong>, visible to all users with no credits needed.
        </p>

        <div className="flex flex-wrap gap-3 mt-4">
          <span className="cc-pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
            ✓ Free to submit
          </span>
          <span className="cc-pill bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">
            🏛️ OB number adds verification
          </span>
          <span className="cc-pill bg-red-600/10 text-red-400 border border-red-600/20 text-xs">
            ● Alert shown free on all searches
          </span>
        </div>
      </div>

      <StolenReportForm
        onSuccess={(id) => {
          setSuccessId(id);
        }}
      />
    </div>
  );
}
