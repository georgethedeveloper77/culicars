'use client';
// apps/web/src/app/report/[id]/page.tsx

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getReport, Report } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ReportCover } from '@/components/report/ReportCover';
import { StolenReportBanner } from '@/components/report/StolenReportBanner';
import { LockedOverlay, UnlockCTA } from '@/components/report/LockedOverlay';
import { DamageSection } from '@/components/report/DamageSection';
import { OdometerSection } from '@/components/report/OdometerSection';
import { PurposeSection } from '@/components/report/PurposeSection';
import { TheftSection } from '@/components/report/TheftSection';
import { SpecsEquipment } from '@/components/report/SpecsEquipment';
import { Timeline } from '@/components/report/Timeline';
import { PhotoGrid } from '@/components/report/PhotoGrid';
import { ServiceSection } from '@/components/report/ServiceSection';
import { NtsaFetchSection } from '@/components/report/NtsaFetchSection';
import { SECTION_META } from '@/lib/constants';

// ── Section wrapper ────────────────────────────────────────────────────────
interface SectionWrapperProps {
  id: string;
  label: string;
  icon: string;
  isLocked: boolean;
  dataStatus: string;
  recordCount: number;
  reportId: string;
  onUnlocked: () => void;
  children: React.ReactNode;
}

function SectionWrapper({
  id, label, icon, isLocked, dataStatus, recordCount, reportId, onUnlocked, children,
}: SectionWrapperProps) {
  const [open, setOpen] = useState(true);

  const statusEl = isLocked ? (
    <span className="cc-pill bg-cc-surface text-cc-faint text-xs">🔒 Locked</span>
  ) : dataStatus === 'found' ? (
    <span className="flex items-center gap-1 text-amber-400 text-xs">▲ {recordCount} record{recordCount !== 1 ? 's' : ''} found</span>
  ) : dataStatus === 'not_found' ? (
    <span className="flex items-center gap-1 text-emerald-400 text-xs">✓ Clean</span>
  ) : (
    <span className="flex items-center gap-1 text-cc-faint text-xs">— Not checked</span>
  );

  return (
    <div id={`section-${id}`} className="cc-card scroll-mt-20">
      {/* Section header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-cc-surface-2/50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-cc-text">{label}</span>
          {statusEl}
        </div>
        <span className={`text-cc-faint text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Section body */}
      {open && (
        <div className="border-t border-cc-border">
          {isLocked ? (
            <div>
              <LockedOverlay reportId={reportId} onUnlocked={onUnlocked} />
            </div>
          ) : (
            children
          )}
        </div>
      )}
    </div>
  );
}

// ── Main report page ──────────────────────────────────────────────────────
export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const fetchReport = () => {
    if (!id) return;
    setLoading(true);
    getReport(id, token || undefined)
      .then(data => { setReport(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  };

  useEffect(() => { fetchReport(); }, [id, token]);

  const scrollToSection = (sectionType: string) => {
    const el = document.getElementById(`section-${sectionType}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-cc-border border-t-cc-accent animate-spin" />
        <p className="text-cc-muted text-sm">Loading report…</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-red-400 font-medium mb-2">Report not found</p>
        <p className="text-cc-muted text-sm mb-6">{error || 'This report does not exist or has been removed.'}</p>
        <Link href="/" className="cc-btn-secondary">← Search again</Link>
      </div>
    );
  }

  const sectionMap = Object.fromEntries(report.sections.map(s => [s.sectionType, s]));

  const stolenSection = sectionMap['STOLEN_REPORTS'];
  const stolenData = stolenSection?.data as { reports?: Array<{ status: string; date: string; county: string; obNumber?: string }> } | undefined;
  const activeStolenReport = stolenData?.reports?.find(r => r.status === 'active');

  // Ordered section rendering
  const SECTION_ORDER = [
    'PHOTOS', 'PURPOSE', 'THEFT', 'ODOMETER', 'LEGAL', 'DAMAGE',
    'IMPORT', 'OWNERSHIP', 'SERVICE', 'TIMELINE', 'RECOMMENDATION',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4 fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-cc-faint">
        <Link href="/" className="hover:text-cc-text transition-colors">Home</Link>
        <span>/</span>
        <Link href="/search" className="hover:text-cc-text transition-colors">Search</Link>
        <span>/</span>
        <span className="text-cc-muted">{report.vehicle.year} {report.vehicle.make} {report.vehicle.model}</span>
      </div>

      {/* Stolen banner — always first if active */}
      {activeStolenReport && (
        <StolenReportBanner
          alert={{
            active: true,
            date: activeStolenReport.date,
            county: activeStolenReport.county,
            obNumber: activeStolenReport.obNumber,
          }}
          plate={report.vehicle.plate}
        />
      )}

      {/* Report cover */}
      <ReportCover report={report} onSectionClick={scrollToSection} />

      {/* Unlock CTA bar if any sections locked */}
      {report.sections.some(s => s.isLocked) && (
        <div className="cc-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-cc-accent/20">
          <div>
            <p className="font-semibold text-cc-text">Unlock the full report</p>
            <p className="text-cc-muted text-sm mt-0.5">
              1 credit unlocks all sections — damage, odometer, legal, purpose, and more.
            </p>
          </div>
          <UnlockCTA reportId={id} onUnlocked={fetchReport} className="shrink-0 w-full sm:w-auto" />
        </div>
      )}

      {/* FREE: Identity */}
      {sectionMap['IDENTITY'] && !sectionMap['IDENTITY'].isLocked && (
        <div id="section-IDENTITY" className="cc-card scroll-mt-20">
          <div className="px-6 py-4 border-b border-cc-border">
            <span className="cc-section-heading">🪪 Identity &amp; Specs</span>
          </div>
          <div className="p-6">
            <IdentitySection data={sectionMap['IDENTITY'].data as Record<string, unknown>} vehicle={report.vehicle} vin={report.vin} />
          </div>
        </div>
      )}

      {/* FREE: Specs & Equipment */}
      {sectionMap['SPECS_EQUIPMENT'] && (
        <SectionWrapper
          id="SPECS_EQUIPMENT"
          label={SECTION_META.SPECS_EQUIPMENT.label}
          icon={SECTION_META.SPECS_EQUIPMENT.icon}
          isLocked={sectionMap['SPECS_EQUIPMENT'].isLocked}
          dataStatus={sectionMap['SPECS_EQUIPMENT'].dataStatus}
          recordCount={sectionMap['SPECS_EQUIPMENT'].recordCount}
          reportId={id}
          onUnlocked={fetchReport}
        >
          <SpecsEquipment data={sectionMap['SPECS_EQUIPMENT'].data as Parameters<typeof SpecsEquipment>[0]['data']} />
        </SectionWrapper>
      )}

      {/* FREE: Stolen reports */}
      {sectionMap['STOLEN_REPORTS'] && (
        <div id="section-STOLEN_REPORTS" className="cc-card scroll-mt-20">
          <div className="px-6 py-4 border-b border-cc-border flex items-center justify-between">
            <span className="cc-section-heading">🚨 Stolen Reports</span>
            <span className="cc-pill bg-emerald-500/10 text-emerald-400 text-xs">Free — always visible</span>
          </div>
          <StolenReportsSection data={sectionMap['STOLEN_REPORTS'].data as Record<string, unknown>} plate={report.vehicle.plate} />
        </div>
      )}

      {/* Locked/unlocked sections */}
      {SECTION_ORDER.map(type => {
        const sec = sectionMap[type];
        if (!sec) return null;
        const meta = SECTION_META[type];
        if (!meta) return null;

        return (
          <SectionWrapper
            key={type}
            id={type}
            label={meta.label}
            icon={meta.icon}
            isLocked={sec.isLocked}
            dataStatus={sec.dataStatus}
            recordCount={sec.recordCount}
            reportId={id}
            onUnlocked={fetchReport}
          >
            {renderSectionContent(type, sec.data as Record<string, unknown>, report)}
          </SectionWrapper>
        );
      })}

      {/* NTSA Fetch section */}
      <div className="cc-card scroll-mt-20">
        <div className="px-6 py-4 border-b border-cc-border">
          <span className="cc-section-heading">🏛️ Official NTSA Record</span>
        </div>
        <NtsaFetchSection
          vin={report.vin}
          plate={report.vehicle.plate}
          ntsaVerified={report.vehicle.ntsa_cor_verified}
          onConsented={fetchReport}
        />
      </div>

      {/* Contribute CTA */}
      <div className="cc-card-2 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-medium text-cc-text text-sm">Know something about this vehicle?</p>
          <p className="text-cc-muted text-xs mt-0.5">Submit evidence, service records, or photos to improve this report.</p>
        </div>
        <Link href={`/contribute/${report.vin}`} className="cc-btn-secondary shrink-0 text-sm">
          Contribute data →
        </Link>
      </div>
    </div>
  );
}

// ── Identity section (inline, no wrapper) ─────────────────────────────────
function IdentitySection({ data, vehicle, vin }: { data: Record<string, unknown>; vehicle: Report['vehicle']; vin: string }) {
  const rows = [
    { label: 'VIN', value: vin, mono: true },
    { label: 'Plate', value: vehicle.plate, mono: true },
    { label: 'Make', value: vehicle.make },
    { label: 'Model', value: vehicle.model },
    { label: 'Year', value: vehicle.year },
    { label: 'Body type', value: vehicle.bodyType },
    { label: 'Engine', value: vehicle.engineCc ? `${vehicle.engineCc}cc` : undefined },
    { label: 'Fuel', value: vehicle.fuelType },
    { label: 'Transmission', value: vehicle.transmission },
    { label: 'Color', value: vehicle.color },
  ].filter(r => r.value);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {rows.map(r => (
        <div key={r.label} className="cc-card-2 px-3 py-2.5">
          <p className="text-xs text-cc-muted">{r.label}</p>
          <p className={`text-sm font-medium text-cc-text mt-0.5 ${r.mono ? 'font-mono' : ''}`}>
            {String(r.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Stolen reports section (inline) ───────────────────────────────────────
function StolenReportsSection({ data, plate }: { data: Record<string, unknown>; plate: string }) {
  const reports = (data?.reports || []) as Array<{
    id: string; date: string; county: string; obNumber?: string;
    isObVerified: boolean; status: string; color?: string;
  }>;

  if (reports.length === 0) {
    return (
      <div className="p-6 flex items-center gap-3">
        <span className="text-2xl">✓</span>
        <div>
          <p className="font-medium text-emerald-400">No stolen reports for this vehicle</p>
          <p className="text-cc-muted text-sm mt-0.5">Not found in our community stolen reports database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3">
      {reports.map(rep => (
        <div key={rep.id} className="cc-card-2 p-4">
          <div className="flex items-start gap-3">
            <span className={`cc-pill text-xs ${
              rep.status === 'active'
                ? 'bg-red-600/10 text-red-400 border border-red-600/30'
                : rep.status === 'recovered'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-cc-surface text-cc-muted'
            }`}>
              {rep.status === 'active' ? '● STOLEN' : rep.status === 'recovered' ? '✓ RECOVERED' : rep.status}
            </span>
            {rep.isObVerified && (
              <span className="cc-pill bg-blue-500/10 text-blue-400 text-xs border border-blue-500/30">🏛️ OB Verified</span>
            )}
          </div>
          <p className="text-sm text-cc-text mt-2">
            Reported stolen on <strong>{new Date(rep.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> in <strong>{rep.county}</strong>
          </p>
          {rep.obNumber && (
            <p className="text-xs text-cc-muted mt-1">Police OB: <span className="font-mono">{rep.obNumber}</span></p>
          )}
        </div>
      ))}
      <Link href={`/report-stolen/${plate}`} className="text-sm text-red-400 hover:text-red-300 transition-colors">
        Report this vehicle stolen →
      </Link>
    </div>
  );
}

// ── Section content router ─────────────────────────────────────────────────
function renderSectionContent(type: string, data: Record<string, unknown>, report: Report) {
  switch (type) {
    case 'DAMAGE':
      return <DamageSection data={data as unknown as Parameters<typeof DamageSection>[0]['data']} />;
    case 'ODOMETER':
      return <OdometerSection data={data as unknown as Parameters<typeof OdometerSection>[0]['data']} />;
    case 'PURPOSE':
      return <PurposeSection data={data as unknown as Parameters<typeof PurposeSection>[0]['data']} />;
    case 'THEFT':
      return <TheftSection data={{ ...(data as unknown as Parameters<typeof TheftSection>[0]['data']), plate: report.vehicle.plate }} />;
    case 'TIMELINE':
      return <Timeline data={data as unknown as Parameters<typeof Timeline>[0]['data']} />;
    case 'PHOTOS':
      return <PhotoGrid data={data as unknown as Parameters<typeof PhotoGrid>[0]['data']} />;
    case 'SERVICE':
      return <ServiceSection data={data as unknown as Parameters<typeof ServiceSection>[0]['data']} />;
    case 'LEGAL':
      return <LegalSection data={data} />;
    case 'OWNERSHIP':
      return <OwnershipSection data={data} />;
    case 'IMPORT':
      return <ImportSection data={data} />;
    case 'RECOMMENDATION':
      return <RecommendationSection data={data} riskLevel={report.riskLevel} recommendation={report.recommendation} />;
    default:
      return (
        <div className="p-6">
          <pre className="text-xs text-cc-muted overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        </div>
      );
  }
}

// ── Inline section components ──────────────────────────────────────────────

function LegalSection({ data }: { data: Record<string, unknown> }) {
  type LegalCheck = { label: string; status: string; detail?: string };
  const checks = (data?.checks || []) as LegalCheck[];
  return (
    <div className="p-6">
      <div className="grid sm:grid-cols-2 gap-3">
        {checks.map((check, i) => (
          <div key={i} className={`rounded-xl border p-4 ${
            check.status === 'found' ? 'bg-red-950/20 border-red-900/40' : 'cc-card-2'
          }`}>
            <p className="text-sm font-medium text-cc-text">{check.label}</p>
            <span className={`text-xs mt-1 block ${
              check.status === 'found' ? 'text-red-400' : check.status === 'not_found' ? 'text-emerald-400' : 'text-cc-faint'
            }`}>
              {check.status === 'found' ? '⚠ Record found' : check.status === 'not_found' ? '✓ Clear' : '— Not checked'}
            </span>
            {check.detail && <p className="text-xs text-cc-muted mt-1">{check.detail}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnershipSection({ data }: { data: Record<string, unknown> }) {
  const count = (data?.transferCount || 0) as number;
  const years = (data?.ownershipYears || []) as string[];
  return (
    <div className="p-6 space-y-4">
      <div className="cc-card-2 p-4 flex items-center gap-4">
        <span className="text-3xl font-bold text-cc-accent">{count}</span>
        <div>
          <p className="font-medium text-cc-text">Ownership change{count !== 1 ? 's' : ''}</p>
          <p className="text-xs text-cc-muted mt-0.5">
            {count >= 4 ? '▲ High number of ownership changes' : count === 0 ? '✓ Original owner' : 'Normal ownership history'}
          </p>
        </div>
      </div>
      {years.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {years.map((yr, i) => (
            <span key={i} className="cc-pill bg-cc-surface text-cc-muted text-xs">{yr}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ImportSection({ data }: { data: Record<string, unknown> }) {
  const fields = [
    { label: 'Origin country', value: data.originCountry },
    { label: 'Import country', value: data.importCountry },
    { label: 'KRA clearance', value: data.kraCleared ? 'Cleared ✓' : data.kraCleared === false ? 'Not cleared ⚠' : 'Unknown' },
    { label: 'Import date', value: data.importDate ? new Date(data.importDate as string).toLocaleDateString('en-KE', { year: 'numeric', month: 'short' }) : undefined },
    { label: 'Japan auction', value: data.japanAuctionGrade ? `Grade ${data.japanAuctionGrade}` : undefined },
    { label: 'Auction mileage', value: data.japanAuctionMileage ? `${(data.japanAuctionMileage as number).toLocaleString()} km` : undefined },
  ].filter(f => f.value);

  return (
    <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
      {fields.map(f => (
        <div key={f.label} className="cc-card-2 px-3 py-2.5">
          <p className="text-xs text-cc-muted">{f.label}</p>
          <p className="text-sm font-medium text-cc-text mt-0.5">{String(f.value)}</p>
        </div>
      ))}
    </div>
  );
}

function RecommendationSection({
  data, riskLevel, recommendation,
}: {
  data: Record<string, unknown>;
  riskLevel: string;
  recommendation: string;
}) {
  const recMeta = {
    proceed: { label: 'Proceed with confidence', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: '✓' },
    caution: { label: 'Proceed with caution', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: '▲' },
    avoid:   { label: 'Avoid this vehicle', color: 'text-red-400', bg: 'bg-red-600/10 border-red-600/30', icon: '✕' },
  };
  const meta = recMeta[recommendation as keyof typeof recMeta] || recMeta.caution;
  const notes = (data?.notes || []) as string[];

  return (
    <div className="p-6 space-y-4">
      <div className={`rounded-xl border p-5 flex items-center gap-4 ${meta.bg}`}>
        <span className={`text-3xl font-bold ${meta.color}`}>{meta.icon}</span>
        <div>
          <p className={`text-lg font-bold ${meta.color}`}>{meta.label}</p>
          <p className="text-sm text-cc-muted mt-0.5">
            Risk level: <span className="capitalize font-medium">{riskLevel}</span>
          </p>
        </div>
      </div>
      {notes.length > 0 && (
        <ul className="space-y-2">
          {notes.map((note, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-cc-muted">
              <span className="text-cc-faint mt-0.5">·</span>
              {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
