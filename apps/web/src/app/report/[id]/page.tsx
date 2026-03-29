// apps/web/src/app/report/[id]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

type ReportState = 'verified' | 'partial' | 'low_confidence' | 'pending_enrichment';

interface Report {
  id: string;
  vin: string;
  plate: string | null;
  state: ReportState;
  riskScore: number;
  riskLevel: string;
  riskFlags: string[];
  sections: Record<string, any>;
  generatedAt: string;
}

// ─── State badge ───────────────────────────────────────────────────────────

const STATE_META: Record<ReportState, { label: string; color: string; icon: string }> = {
  verified:           { label: 'Verified',           color: 'bg-green-600',   icon: '✓' },
  partial:            { label: 'Partial',             color: 'bg-yellow-500',  icon: '◑' },
  low_confidence:     { label: 'Low Confidence',      color: 'bg-orange-500',  icon: '!' },
  pending_enrichment: { label: 'Pending Enrichment',  color: 'bg-gray-500',    icon: '…' },
};

function StateBadge({ state }: { state: ReportState }) {
  const meta = STATE_META[state] ?? STATE_META.pending_enrichment;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

// ─── Risk meter ────────────────────────────────────────────────────────────

function RiskMeter({ score, level, flags }: { score: number; level: string; flags: string[] }) {
  const color =
    level === 'critical' ? 'bg-red-600' :
    level === 'high'     ? 'bg-orange-500' :
    level === 'medium'   ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Risk Assessment</h3>
        <span className={`text-sm font-bold text-white px-3 py-1 rounded-full capitalize ${color}`}>{level}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-gray-500">{score}/100</p>
      {flags.length > 0 && (
        <ul className="space-y-1">
          {flags.map((f, i) => (
            <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span> {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Section shell (locked) ────────────────────────────────────────────────

function LockedSection({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 relative overflow-hidden">
      <div className="blur-sm select-none pointer-events-none">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 dark:bg-gray-900/60">
        <span className="text-2xl mb-1">🔒</span>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Unlock to view {title}</p>
      </div>
    </div>
  );
}

// ─── Identity section ──────────────────────────────────────────────────────

function IdentitySection({ data }: { data: any }) {
  const fields = [
    { label: 'Plate',        value: data.plate },
    { label: 'VIN',          value: data.vin },
    { label: 'Make',         value: data.make },
    { label: 'Model',        value: data.model },
    { label: 'Year',         value: data.year },
    { label: 'Color',        value: data.color },
    { label: 'Fuel Type',    value: data.fuelType },
    { label: 'Body Type',    value: data.bodyType },
    { label: 'Reg. Date',    value: data.registrationDate },
  ].filter((f) => f.value != null);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Vehicle Identity</h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
        {fields.map((f) => (
          <div key={f.label}>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">{f.label}</dt>
            <dd className="text-sm font-medium text-gray-800 dark:text-gray-200">{String(f.value)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-gray-400">
        {data.sourceCount} data source{data.sourceCount !== 1 ? 's' : ''} · Confidence {Math.round(data.confidence * 100)}%
      </p>
    </div>
  );
}

// ─── Stolen alerts ─────────────────────────────────────────────────────────

function StolenAlertsSection({ data }: { data: any }) {
  if (!data.isStolen && data.alerts.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 p-5">
        <h3 className="font-semibold text-green-700 dark:text-green-400">No Theft Alerts</h3>
        <p className="text-sm text-green-600 dark:text-green-300 mt-1">No stolen vehicle reports found for this vehicle.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-5 ${data.isStolen ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
      <h3 className={`font-semibold mb-2 ${data.isStolen ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'}`}>
        {data.isStolen ? '⚠ Theft Alert' : 'Theft Status'}
      </h3>
      {data.isStolen && (
        <p className="text-sm text-red-600 dark:text-red-300 mb-3 font-medium">
          This vehicle has been reported stolen.
          {data.isRecovered && ' A recovery report has also been filed.'}
        </p>
      )}
      {data.alerts.map((a: any) => (
        <div key={a.id} className="text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          <span className="font-medium capitalize">{a.type.replace(/_/g, ' ')}</span>
          {a.reportedAt && (
            <span className="text-gray-400 ml-2 text-xs">
              {new Date(a.reportedAt).toLocaleDateString()}
            </span>
          )}
          {a.description && <p className="text-gray-500 mt-0.5">{a.description}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Pending enrichment shell ──────────────────────────────────────────────

function PendingShell({ plate, vin }: { plate: string | null; vin: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center space-y-3">
      <p className="text-4xl">🔍</p>
      <h3 className="font-semibold text-gray-800 dark:text-gray-100">Searching for records</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">
        No records are available for {plate ?? vin} yet. We have logged your search and will notify you
        when vehicle data becomes available.
      </p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First try preview (no auth needed for initial load)
      const res = await fetch(`${API}/reports/${id}/preview`);
      if (!res.ok) throw new Error('Report not found');
      const data = await res.json();
      setReport(data.report);
      setIsUnlocked(data.isUnlocked);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchReport();
  }, [id, fetchReport]);

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const res = await fetch(`${API}/reports/${id}/unlock`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.status === 401) {
        router.push('/login?next=/report/' + id);
        return;
      }
      if (res.status === 402) {
        router.push('/pricing?reason=insufficient_credits');
        return;
      }
      if (!res.ok) throw new Error('Unlock failed');
      const data = await res.json();
      setReport(data.report);
      setIsUnlocked(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-4xl">🚗</p>
          <p className="text-gray-600 dark:text-gray-300">{error ?? 'Report not found'}</p>
          <button onClick={() => router.push('/')} className="text-blue-600 underline text-sm">
            Start a new search
          </button>
        </div>
      </div>
    );
  }

  const s = report.sections;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {report.plate ?? report.vin}
            </h1>
            {report.plate && (
              <p className="text-sm text-gray-500 font-mono mt-0.5">{report.vin}</p>
            )}
          </div>
          <StateBadge state={report.state} />
        </div>

        {/* Pending state */}
        {report.state === 'pending_enrichment' && (
          <PendingShell plate={report.plate} vin={report.vin} />
        )}

        {/* Risk meter — always shown when not pending */}
        {report.state !== 'pending_enrichment' && (
          <RiskMeter
            score={report.riskScore}
            level={report.riskLevel}
            flags={report.riskFlags}
          />
        )}

        {/* Identity — always free */}
        {s.identity && report.state !== 'pending_enrichment' && (
          <IdentitySection data={s.identity} />
        )}

        {/* Stolen alerts — always free */}
        {s.stolenAlerts && report.state !== 'pending_enrichment' && (
          <StolenAlertsSection data={s.stolenAlerts} />
        )}

        {/* Unlock CTA */}
        {!isUnlocked && report.state !== 'pending_enrichment' && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-6 text-center space-y-3">
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              Full report — 1 credit
            </p>
            <p className="text-sm text-gray-500">
              Ownership history, damage records, odometer readings, and timeline.
            </p>
            <button
              onClick={handleUnlock}
              disabled={unlocking}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-60"
            >
              {unlocking ? 'Unlocking…' : 'Unlock Full Report'}
            </button>
          </div>
        )}

        {/* Locked sections */}
        {!isUnlocked && report.state !== 'pending_enrichment' && (
          <>
            <LockedSection title="Ownership History" />
            <LockedSection title="Damage Records" />
            <LockedSection title="Odometer Readings" />
            <LockedSection title="Vehicle Timeline" />
            <LockedSection title="Community Insights" />
          </>
        )}

        {/* Unlocked sections */}
        {isUnlocked && (
          <>
            {/* Ownership */}
            {s.ownership && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-2">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Ownership</h3>
                {s.ownership.verified ? (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">✓ Officially verified</p>
                ) : (
                  <p className="text-sm text-orange-500">Ownership confidence: {Math.round(s.ownership.confidence * 100)}%</p>
                )}
                {s.ownership.ownerCount != null && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">Previous owners: {s.ownership.ownerCount}</p>
                )}
                {s.ownership.lastTransferDate && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Last transfer: {new Date(s.ownership.lastTransferDate).toLocaleDateString()}
                  </p>
                )}
                {s.ownership.verificationRequired && (
                  <a href={`/verify?vin=${report.vin}`} className="text-sm text-blue-600 underline">
                    Verify official record →
                  </a>
                )}
              </div>
            )}

            {/* Damage */}
            {s.damage && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-2">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                  Damage Records
                  {s.damage.recordCount > 0 && (
                    <span className="ml-2 text-sm font-normal text-orange-500">({s.damage.recordCount})</span>
                  )}
                </h3>
                {s.damage.recordCount === 0 ? (
                  <p className="text-sm text-green-600 dark:text-green-400">No damage records found.</p>
                ) : (
                  s.damage.records.map((d: any, i: number) => (
                    <div key={i} className="text-sm border-t border-gray-100 dark:border-gray-800 pt-2">
                      {d.date && <span className="text-gray-400 text-xs">{new Date(d.date).toLocaleDateString()} · </span>}
                      <span className="text-gray-700 dark:text-gray-300">{d.description ?? d.location ?? 'Damage record'}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Odometer */}
            {s.odometer && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100">Odometer</h3>
                  {s.odometer.anomalyDetected && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">⚠ Anomaly detected</span>
                  )}
                </div>
                {s.odometer.latestReading ? (
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {s.odometer.latestReading.value.toLocaleString()} {s.odometer.latestReading.unit}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">No odometer records available.</p>
                )}
                {s.odometer.readings.length > 1 && (
                  <p className="text-xs text-gray-400">{s.odometer.readings.length} readings on record</p>
                )}
              </div>
            )}

            {/* Timeline */}
            {s.timeline && s.timeline.events.length > 0 && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Vehicle Timeline</h3>
                <ol className="relative border-l border-gray-200 dark:border-gray-700 space-y-4 pl-4">
                  {s.timeline.events.slice(0, 10).map((e: any, i: number) => (
                    <li key={i} className="ml-2">
                      <div className="absolute w-2.5 h-2.5 bg-blue-600 rounded-full -left-1.5 mt-0.5" />
                      <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{e.label}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Community Insights */}
            {s.communityInsights && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-2">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Community Insights</h3>
                {!s.communityInsights.available ? (
                  <p className="text-sm text-gray-400">{s.communityInsights.placeholder}</p>
                ) : (
                  s.communityInsights.insights.map((ins: any, i: number) => (
                    <div
                      key={i}
                      className={`text-sm p-2 rounded-lg ${
                        ins.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                        ins.severity === 'warning'  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' :
                        'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <span className="font-medium">{ins.label}: </span>{ins.value}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        <p className="text-xs text-gray-400 text-center">
          Generated {new Date(report.generatedAt).toLocaleString()} · culicars.com
        </p>
      </div>
    </main>
  );
}
