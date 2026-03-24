'use client';
// apps/web/src/app/report/new/page.tsx

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getReportByVin } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Suspense } from 'react';

function NewReportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { token } = useAuth();

  const vin = searchParams.get('vin') || '';
  const plate = searchParams.get('plate') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vin) return;
    setLoading(true);
    getReportByVin(vin, token || undefined)
      .then(report => {
        router.replace(`/report/${report.id}`);
      })
      .catch(err => {
        setError(err.message || 'Could not generate report');
        setLoading(false);
      });
  }, [vin, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-cc-border border-t-cc-accent animate-spin" />
        <div className="text-center">
          <p className="text-cc-text font-medium">Generating report…</p>
          <p className="text-cc-muted text-sm mt-1">
            Checking 13 data sources for{' '}
            <span className="font-mono font-semibold">{plate || vin}</span>
          </p>
        </div>
        <div className="flex flex-col gap-1.5 mt-2 text-xs text-cc-faint text-center">
          {[
            'Checking NTSA records…',
            'Scanning KRA import data…',
            'Checking stolen vehicle reports…',
            'Analysing service history…',
          ].map((msg, i) => (
            <p key={i} className="fade-in" style={{ animationDelay: `${i * 0.8}s` }}>{msg}</p>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="cc-card p-8">
          <span className="text-4xl block mb-3">⚠</span>
          <h3 className="font-semibold text-cc-text mb-2">Report generation failed</h3>
          <p className="text-cc-muted text-sm mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Link href={`/search?q=${encodeURIComponent(plate || vin)}`} className="cc-btn-secondary">
              ← Back to search results
            </Link>
            <Link href={`/contribute/${vin}`} className="text-sm text-cc-muted hover:text-cc-text transition-colors">
              Contribute data for this vehicle
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No VIN — show entry form
  return (
    <div className="max-w-lg mx-auto py-16 px-4">
      <h1 className="text-2xl font-bold text-cc-text mb-2">Get a Vehicle Report</h1>
      <p className="text-cc-muted mb-8">Enter a plate or VIN to start.</p>
      <Link href="/" className="cc-btn-secondary w-full text-center">
        ← Search from homepage
      </Link>
    </div>
  );
}

export default function NewReportPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <Suspense fallback={
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-cc-border border-t-cc-accent animate-spin" />
        </div>
      }>
        <NewReportContent />
      </Suspense>
    </div>
  );
}
