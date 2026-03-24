"use strict";
// apps/admin/src/app/reports/[id]/page.tsx
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReportDetailPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const api_1 = require("@/lib/api");
const PageHeader_1 = require("@/components/ui/PageHeader");
const StatusBadge_1 = require("@/components/ui/StatusBadge");
function ReportDetailPage({ params }) {
    const [report, setReport] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        (0, api_1.apiGet)(`/reports/${params.id}`)
            .then(setReport)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [params.id]);
    if (loading) {
        return (<div className="space-y-4">
        <div className="h-8 w-48 bg-white/6 rounded animate-pulse"/>
        <div className="h-40 bg-white/4 rounded-xl animate-pulse"/>
      </div>);
    }
    if (!report) {
        return <div className="text-zinc-500">Report not found.</div>;
    }
    return (<div>
      <link_1.default href="/reports" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
        <lucide_react_1.ChevronLeft className="w-4 h-4"/>
        Back to Reports
      </link_1.default>

      <PageHeader_1.PageHeader title={`${report.vehicle?.make ?? ''} ${report.vehicle?.model ?? ''} ${report.vehicle?.year ?? ''}`} description={report.vin} actions={<div className="flex items-center gap-2">
            <StatusBadge_1.ReportStatusBadge status={report.status}/>
            <StatusBadge_1.RiskBadge level={report.riskLevel}/>
          </div>}/>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
            { label: 'Risk Score', value: `${report.riskScore}/100` },
            { label: 'Recommendation', value: report.recommendation ?? '—' },
            { label: 'Sources Checked', value: report.sourcesChecked },
            { label: 'Records Found', value: report.recordsFound },
        ].map(({ label, value }) => (<div key={label} className="rounded-xl border border-white/8 bg-[#141414] p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-xl font-bold text-zinc-100 capitalize">{String(value).toLowerCase()}</p>
          </div>))}
      </div>

      {/* Sections */}
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Report Sections</h2>
      <div className="space-y-2">
        {(report.sections ?? []).map((sec) => (<div key={sec.id} className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-[#141414]">
            <div className="flex items-center gap-3">
              {sec.dataStatus === 'found' ? (<lucide_react_1.CheckCircle className="w-4 h-4 text-emerald-400"/>) : sec.dataStatus === 'not_found' ? (<lucide_react_1.Shield className="w-4 h-4 text-zinc-500"/>) : (<lucide_react_1.AlertTriangle className="w-4 h-4 text-amber-400"/>)}
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  {sec.sectionType.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-zinc-500">
                  {sec.recordCount} record{sec.recordCount !== 1 ? 's' : ''} · {sec.dataStatus.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-md ${sec.isLocked
                ? 'bg-zinc-800 text-zinc-400'
                : 'bg-emerald-500/15 text-emerald-400'}`}>
                {sec.isLocked ? 'LOCKED' : 'FREE'}
              </span>
            </div>
          </div>))}
        {!(report.sections ?? []).length && (<p className="text-sm text-zinc-600">No sections generated yet.</p>)}
      </div>
    </div>);
}
