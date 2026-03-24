"use strict";
// apps/admin/src/app/contributions/page.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ContributionsPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const api_1 = require("@/lib/api");
const PageHeader_1 = require("@/components/ui/PageHeader");
const DataTable_1 = require("@/components/ui/DataTable");
const StatusBadge_1 = require("@/components/ui/StatusBadge");
const STATUSES = ['all', 'pending', 'approved', 'rejected', 'flagged'];
function ContributionsPage() {
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const statusFilter = (searchParams.get('status') ?? 'pending');
    const [contributions, setContributions] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        setLoading(true);
        const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
        (0, api_1.apiGet)(`/contributions${qs}`)
            .then(setContributions)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [statusFilter]);
    const columns = [
        {
            key: 'type',
            header: 'Type',
            render: (c) => (<span className="text-xs font-mono text-zinc-400">{c.type.replace(/_/g, ' ')}</span>),
            width: '180px',
        },
        {
            key: 'title',
            header: 'Title',
            render: (c) => (<div>
          <p className="font-medium text-zinc-200">{c.title}</p>
          {c.description && (<p className="text-xs text-zinc-500 mt-0.5 truncate max-w-xs">{c.description}</p>)}
        </div>),
        },
        {
            key: 'vin',
            header: 'VIN',
            render: (c) => (<span className="text-xs font-mono text-zinc-400">{c.vin}</span>),
            width: '180px',
        },
        {
            key: 'user',
            header: 'Submitter',
            render: (c) => (<span className="text-sm text-zinc-400">{c.user?.email ?? 'Anonymous'}</span>),
        },
        {
            key: 'status',
            header: 'Status',
            render: (c) => <StatusBadge_1.ContribStatusBadge status={c.status}/>,
            width: '100px',
        },
        {
            key: 'confidence',
            header: 'Confidence',
            render: (c) => (<span className="text-sm text-zinc-400">
          {c.confidenceScore != null ? `${(c.confidenceScore * 100).toFixed(0)}%` : '—'}
        </span>),
            width: '100px',
        },
        {
            key: 'createdAt',
            header: 'Submitted',
            render: (c) => (<span className="text-sm text-zinc-500">
          {new Date(c.createdAt).toLocaleDateString()}
        </span>),
            width: '110px',
        },
    ];
    return (<div>
      <PageHeader_1.PageHeader title="Contributions" description="User-submitted vehicle evidence"/>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-white/4 rounded-lg p-1 w-fit">
        {STATUSES.map((s) => (<button key={s} onClick={() => router.push(s === 'all' ? '/contributions' : `/contributions?status=${s}`)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${statusFilter === s
                ? 'bg-[#D4A843] text-black'
                : 'text-zinc-400 hover:text-zinc-200'}`}>
            {s}
          </button>))}
      </div>

      <DataTable_1.DataTable columns={columns} data={contributions} loading={loading} emptyMessage="No contributions found." onRowClick={(c) => router.push(`/contributions/${c.id}`)}/>
    </div>);
}
