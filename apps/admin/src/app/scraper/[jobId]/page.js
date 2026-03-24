"use strict";
// apps/admin/src/app/scraper/[jobId]/page.tsx
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ScraperJobDetailPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const api_1 = require("@/lib/api");
const PageHeader_1 = require("@/components/ui/PageHeader");
const StatusBadge_1 = require("@/components/ui/StatusBadge");
function ScraperJobDetailPage({ params }) {
    const [job, setJob] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [expandedRow, setExpandedRow] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        (0, api_1.apiGet)(`/admin/scraper/jobs/${params.jobId}`)
            .then(setJob)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [params.jobId]);
    if (loading) {
        return <div className="h-64 bg-white/4 rounded-xl animate-pulse"/>;
    }
    if (!job) {
        return <div className="text-zinc-500">Job not found.</div>;
    }
    return (<div>
      <link_1.default href="/scraper" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
        <lucide_react_1.ChevronLeft className="w-4 h-4"/>
        Back to Scraper Jobs
      </link_1.default>

      <PageHeader_1.PageHeader title={`${job.source.replace(/_/g, ' ')} — Job Detail`} description={job.id} actions={<StatusBadge_1.JobStatusBadge status={job.status}/>}/>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
            { label: 'Items Found', value: job.itemsFound, color: 'text-zinc-100' },
            { label: 'Items Stored', value: job.itemsStored, color: 'text-emerald-400' },
            { label: 'Items Skipped', value: job.itemsSkipped, color: 'text-zinc-400' },
            { label: 'Trigger', value: job.trigger, color: 'text-zinc-300' },
        ].map(({ label, value, color }) => (<div key={label} className="rounded-xl border border-white/8 bg-[#141414] p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-xl font-bold capitalize ${color}`}>{value}</p>
          </div>))}
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
            { label: 'Started', value: job.startedAt ? new Date(job.startedAt).toLocaleString() : '—' },
            { label: 'Completed', value: job.completedAt ? new Date(job.completedAt).toLocaleString() : '—' },
        ].map(({ label, value }) => (<div key={label} className="rounded-xl border border-white/8 bg-[#141414] p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm text-zinc-200">{value}</p>
          </div>))}
      </div>

      {/* Error log */}
      {job.errorLog && (<div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <h3 className="text-sm font-semibold text-red-400 mb-2">Error Log</h3>
          <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap overflow-x-auto">
            {job.errorLog}
          </pre>
        </div>)}

      {/* Raw data */}
      {(job.rawData ?? []).length > 0 && (<div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
            Raw Data ({job.rawData.length} items)
          </h2>
          <div className="space-y-2">
            {job.rawData.map((item) => (<div key={item.id} className="rounded-xl border border-white/8 bg-[#141414] overflow-hidden">
                <button onClick={() => setExpandedRow((e) => (e === item.id ? null : item.id))} className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/4 transition-colors text-left">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-zinc-400">{item.id.slice(0, 8)}…</span>
                    {item.plate && <span className="font-mono text-sm text-zinc-200">{item.plate}</span>}
                    {item.vin && <span className="font-mono text-xs text-zinc-400">{item.vin}</span>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${item.processed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    {item.processed ? 'Processed' : 'Pending'}
                  </span>
                </button>
                {expandedRow === item.id && (<div className="border-t border-white/6 p-5">
                    <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap overflow-x-auto max-h-96">
                      {JSON.stringify(item.rawData, null, 2)}
                    </pre>
                  </div>)}
              </div>))}
          </div>
        </div>)}
    </div>);
}
