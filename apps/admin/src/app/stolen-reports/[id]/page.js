"use strict";
// apps/admin/src/app/stolen-reports/[id]/page.tsx
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StolenReportDetailPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const api_1 = require("@/lib/api");
const PageHeader_1 = require("@/components/ui/PageHeader");
const StatusBadge_1 = require("@/components/ui/StatusBadge");
const StolenReportCard_1 = require("@/components/stolen/StolenReportCard");
const StolenReviewActions_1 = require("@/components/stolen/StolenReviewActions");
function StolenReportDetailPage({ params }) {
    const [report, setReport] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        (0, api_1.apiGet)(`/stolen-reports/${params.id}`)
            .then(setReport)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [params.id]);
    function handleUpdate(newStatus, note) {
        setReport((prev) => prev ? { ...prev, status: newStatus, adminNote: note } : prev);
    }
    if (loading) {
        return <div className="h-64 bg-white/4 rounded-xl animate-pulse"/>;
    }
    if (!report) {
        return <div className="text-zinc-500">Stolen report not found.</div>;
    }
    return (<div>
      <link_1.default href="/stolen-reports" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
        <lucide_react_1.ChevronLeft className="w-4 h-4"/>
        Back to Stolen Reports
      </link_1.default>

      <PageHeader_1.PageHeader title={`Stolen Report — ${report.plateDisplay ?? report.plate}`} description={`Submitted ${new Date(report.createdAt).toLocaleString()}`} actions={<StatusBadge_1.StolenStatusBadge status={report.status}/>}/>

      <div className="grid grid-cols-3 gap-6">
        {/* Main */}
        <div className="col-span-2 space-y-6">
          <StolenReportCard_1.StolenReportCard report={report}/>

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
        ].map(({ label, ok }) => (<li key={label} className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-500'}`}>
                    {ok ? '✓' : '—'}
                  </span>
                  <span className={ok ? 'text-zinc-300' : 'text-zinc-500'}>{label}</span>
                </li>))}
            </ul>
          </div>

          {/* Photos */}
          {report.photoUrls?.length > 0 && (<div className="rounded-xl border border-white/8 bg-[#141414] p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                Owner Photos ({report.photoUrls.length})
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {report.photoUrls.map((url, i) => (<a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-video rounded-lg bg-zinc-800 overflow-hidden group relative">
                    <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <lucide_react_1.ExternalLink className="w-5 h-5 text-white"/>
                    </div>
                  </a>))}
              </div>
            </div>)}

          {/* Admin note */}
          {report.adminNote && (<div className="rounded-xl border border-white/8 bg-[#141414] p-5">
              <h3 className="text-sm font-semibold text-zinc-300 mb-2">Admin Note</h3>
              <p className="text-sm text-zinc-400">{report.adminNote}</p>
            </div>)}
        </div>

        {/* Sidebar */}
        <div>
          <StolenReviewActions_1.StolenReviewActions reportId={report.id} currentStatus={report.status} onUpdate={handleUpdate}/>
        </div>
      </div>
    </div>);
}
