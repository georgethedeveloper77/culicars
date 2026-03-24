"use strict";
// apps/admin/src/app/stolen-reports/page.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StolenReportsPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const api_1 = require("@/lib/api");
const PageHeader_1 = require("@/components/ui/PageHeader");
const DataTable_1 = require("@/components/ui/DataTable");
const StatusBadge_1 = require("@/components/ui/StatusBadge");
const STATUSES = ['all', 'pending', 'active', 'recovered', 'rejected', 'duplicate'];
function StolenReportsPage() {
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const statusFilter = (searchParams.get('status') ?? 'pending');
    const [reports, setReports] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        setLoading(true);
        const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
        (0, api_1.apiGet)(`/stolen-reports${qs}`)
            .then(setReports)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [statusFilter]);
    const columns = [
        {
            key: 'plate',
            header: 'Plate',
            render: (r) => (<div>
          <span className="font-bold font-mono text-zinc-100">{r.plateDisplay ?? r.plate}</span>
          {r.isObVerified && (<span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">OB✓</span>)}
          {r.vin && <p className="text-xs font-mono text-zinc-500 mt-0.5">{r.vin}</p>}
        </div>),
        },
        {
            key: 'location',
            header: 'Location',
            render: (r) => (<span className="text-sm text-zinc-300">{r.countyStolen}, {r.townStolen}</span>),
        },
        {
            key: 'dateStolenString',
            header: 'Date Stolen',
            render: (r) => (<span className="text-sm text-zinc-400">{r.dateStolenString}</span>),
            width: '120px',
        },
        {
            key: 'obNumber',
            header: 'OB Number',
            render: (r) => (<span className="text-sm font-mono text-zinc-400">{r.policeObNumber ?? '—'}</span>),
            width: '140px',
        },
        {
            key: 'reporterType',
            header: 'Reporter',
            render: (r) => (<span className="text-sm text-zinc-400 capitalize">{r.reporterType}</span>),
            width: '100px',
        },
        {
            key: 'status',
            header: 'Status',
            render: (r) => <StatusBadge_1.StolenStatusBadge status={r.status}/>,
            width: '110px',
        },
        {
            key: 'createdAt',
            header: 'Submitted',
            render: (r) => (<span className="text-sm text-zinc-500">{new Date(r.createdAt).toLocaleDateString()}</span>),
            width: '110px',
        },
    ];
    const pendingCount = reports.filter((r) => r.status === 'pending').length;
    return (<div>
      <PageHeader_1.PageHeader title="Stolen Reports" description="Community vehicle theft reports — review and approve" actions={pendingCount > 0 ? (<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
              <lucide_react_1.AlertTriangle className="w-4 h-4 text-red-400"/>
              <span className="text-sm font-semibold text-red-400">{pendingCount} pending</span>
            </div>) : undefined}/>

      {/* Status filter */}
      <div className="flex gap-1 mb-6 bg-white/4 rounded-lg p-1 w-fit flex-wrap">
        {STATUSES.map((s) => (<button key={s} onClick={() => router.push(s === 'all' ? '/stolen-reports' : `/stolen-reports?status=${s}`)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${statusFilter === s
                ? 'bg-[#D4A843] text-black'
                : 'text-zinc-400 hover:text-zinc-200'}`}>
            {s}
          </button>))}
      </div>

      <DataTable_1.DataTable columns={columns} data={reports} loading={loading} emptyMessage="No stolen reports found." onRowClick={(r) => router.push(`/stolen-reports/${r.id}`)}/>
    </div>);
}
