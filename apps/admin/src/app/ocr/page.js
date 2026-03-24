"use strict";
// apps/admin/src/app/ocr/page.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OcrPage;
const react_1 = require("react");
const api_1 = require("@/lib/api");
const PageHeader_1 = require("@/components/ui/PageHeader");
const DataTable_1 = require("@/components/ui/DataTable");
const DOC_TYPE_LABELS = {
    logbook: 'Logbook',
    import_doc: 'Import Doc',
    dashboard: 'Dashboard',
    plate_photo: 'Plate Photo',
    ntsa_cor: 'NTSA COR',
};
function OcrPage() {
    const [scans, setScans] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        (0, api_1.apiGet)('/admin/ocr/scans')
            .then(setScans)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);
    const columns = [
        {
            key: 'docType',
            header: 'Document Type',
            render: (s) => (<span className="text-xs font-medium px-2 py-1 rounded-md bg-white/6 text-zinc-300">
          {DOC_TYPE_LABELS[s.documentType] ?? s.documentType}
        </span>),
            width: '140px',
        },
        {
            key: 'plate',
            header: 'Extracted Plate',
            render: (s) => (<span className="font-mono text-zinc-200">{s.extractedPlate ?? '—'}</span>),
            width: '140px',
        },
        {
            key: 'vin',
            header: 'Extracted VIN',
            render: (s) => (<span className="font-mono text-xs text-zinc-400">{s.extractedVin ?? '—'}</span>),
        },
        {
            key: 'confidence',
            header: 'Confidence',
            render: (s) => {
                const pct = s.confidence != null ? Math.round(s.confidence * 100) : null;
                const color = pct == null ? 'text-zinc-500' : pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400';
                return <span className={`text-sm font-semibold ${color}`}>{pct != null ? `${pct}%` : '—'}</span>;
            },
            width: '110px',
        },
        {
            key: 'source',
            header: 'Source',
            render: (s) => (<span className="text-xs text-zinc-500 capitalize">{s.source.replace(/_/g, ' ')}</span>),
            width: '140px',
        },
        {
            key: 'user',
            header: 'User',
            render: (s) => (<span className="text-sm text-zinc-400">{s.user?.email ?? 'Anonymous'}</span>),
        },
        {
            key: 'createdAt',
            header: 'Scanned',
            render: (s) => (<span className="text-sm text-zinc-500">{new Date(s.createdAt).toLocaleString()}</span>),
            width: '170px',
        },
    ];
    const ntsaCount = scans.filter((s) => s.source === 'ntsa_cor_auto').length;
    const avgConf = scans.length > 0
        ? Math.round((scans.reduce((a, s) => a + (s.confidence ?? 0), 0) / scans.length) * 100)
        : 0;
    return (<div>
      <PageHeader_1.PageHeader title="OCR Scans" description="All document scans processed through the OCR pipeline"/>

      {/* Quick stats */}
      <div className="flex gap-4 mb-6">
        {[
            { label: 'Total Scans', value: scans.length },
            { label: 'NTSA COR Auto-Fetches', value: ntsaCount },
            { label: 'Avg Confidence', value: `${avgConf}%` },
        ].map(({ label, value }) => (<div key={label} className="px-5 py-3 rounded-xl border border-white/8 bg-[#141414] flex items-center gap-3">
            <span className="text-xs text-zinc-500">{label}</span>
            <span className="text-lg font-bold text-zinc-100">{value}</span>
          </div>))}
      </div>

      <DataTable_1.DataTable columns={columns} data={scans} loading={loading} emptyMessage="No OCR scans yet."/>
    </div>);
}
