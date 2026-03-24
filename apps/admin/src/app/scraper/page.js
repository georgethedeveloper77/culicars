"use strict";
// apps/admin/src/app/scraper/page.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ScraperPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const api_1 = require("@/lib/api");
const PageHeader_1 = require("@/components/ui/PageHeader");
const DataTable_1 = require("@/components/ui/DataTable");
const StatusBadge_1 = require("@/components/ui/StatusBadge");
const ScraperTrigger_1 = require("@/components/scraper/ScraperTrigger");
function duration(start, end) {
    if (!start)
        return '—';
    const ms = new Date(end ?? Date.now()).getTime() - new Date(start).getTime();
    const s = Math.floor(ms / 1000);
    if (s < 60)
        return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
}
function ScraperPage() {
    const router = (0, navigation_1.useRouter)();
    const [jobs, setJobs] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const load = (0, react_1.useCallback)(() => {
        setLoading(true);
        (0, api_1.apiGet)('/admin/scraper/jobs')
            .then(setJobs)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);
    (0, react_1.useEffect)(() => { load(); }, [load]);
    const columns = [
        {
            key: 'source',
            header: 'Source',
            render: (j) => (<span className="font-mono text-sm font-semibold text-zinc-200">
          {j.source.replace(/_/g, ' ')}
        </span>),
            width: '160px',
        },
        {
            key: 'status',
            header: 'Status',
            render: (j) => <StatusBadge_1.JobStatusBadge status={j.status}/>,
            width: '110px',
        },
        {
            key: 'trigger',
            header: 'Trigger',
            render: (j) => (<span className="text-xs text-zinc-500 capitalize">{j.trigger}</span>),
            width: '90px',
        },
        {
            key: 'items',
            header: 'Items',
            render: (j) => (<div className="text-sm">
          <span className="text-emerald-400">{j.itemsFound}</span>
          <span className="text-zinc-600"> / </span>
          <span className="text-zinc-400">{j.itemsStored} stored</span>
          {j.itemsSkipped > 0 && (<span className="text-zinc-600"> / {j.itemsSkipped} skip</span>)}
        </div>),
        },
        {
            key: 'duration',
            header: 'Duration',
            render: (j) => (<span className="text-sm text-zinc-400">{duration(j.startedAt, j.completedAt)}</span>),
            width: '90px',
        },
        {
            key: 'error',
            header: 'Error',
            render: (j) => (j.errorLog
                ? <span className="text-xs text-red-400 truncate max-w-[200px] block">{j.errorLog.slice(0, 80)}</span>
                : <span className="text-zinc-600">—</span>),
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (j) => (<span className="text-sm text-zinc-500">{new Date(j.createdAt).toLocaleString()}</span>),
            width: '170px',
        },
    ];
    return (<div>
      <PageHeader_1.PageHeader title="Scraper Jobs" description="Data ingestion from 12 sources" actions={<button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/6 hover:bg-white/10 text-sm text-zinc-300 border border-white/10 transition-colors">
            <lucide_react_1.RefreshCw className="w-4 h-4"/>
            Refresh
          </button>}/>

      <div className="mb-6">
        <ScraperTrigger_1.ScraperTrigger onJobCreated={(job) => setJobs((prev) => [job, ...prev])}/>
      </div>

      <DataTable_1.DataTable columns={columns} data={jobs} loading={loading} emptyMessage="No scraper jobs yet." onRowClick={(j) => router.push(`/scraper/${j.id}`)}/>
    </div>);
}
