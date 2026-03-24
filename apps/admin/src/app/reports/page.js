"use strict";
// apps/admin/src/app/reports/page.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReportsPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const api_1 = require("@/lib/api");
const PageHeader_1 = require("@/components/ui/PageHeader");
const DataTable_1 = require("@/components/ui/DataTable");
const StatusBadge_1 = require("@/components/ui/StatusBadge");
function ReportsPage() {
    const router = (0, navigation_1.useRouter)();
    const [reports, setReports] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        (0, api_1.apiGet)('/reports')
            .then(setReports)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);
    const columns = [
        {
            key: 'vin',
            header: 'Vehicle',
            render: (r) => (<div>
          <p className="font-medium">
            {r.vehicle?.make} {r.vehicle?.model} {r.vehicle?.year}
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">{r.vin}</p>
        </div>),
        },
        {
            key: 'status',
            header: 'Status',
            render: (r) => <StatusBadge_1.ReportStatusBadge status={r.status}/>,
            width: '100px',
        },
        {
            key: 'risk',
            header: 'Risk',
            render: (r) => (<div className="flex items-center gap-2">
          <StatusBadge_1.RiskBadge level={r.riskLevel}/>
          <span className="text-xs text-zinc-500">{r.riskScore}/100</span>
        </div>),
            width: '160px',
        },
        {
            key: 'recommendation',
            header: 'Recommendation',
            render: (r) => (<span className="text-sm capitalize">{r.recommendation?.toLowerCase()}</span>),
            width: '120px',
        },
        {
            key: 'sources',
            header: 'Sources',
            render: (r) => (<span className="text-sm text-zinc-400">
          {r.sourcesChecked} checked · {r.recordsFound} found
        </span>),
        },
        {
            key: 'generated',
            header: 'Generated',
            render: (r) => (<span className="text-sm text-zinc-500">
          {r.generatedAt ? new Date(r.generatedAt).toLocaleDateString() : '—'}
        </span>),
            width: '120px',
        },
    ];
    return (<div>
      <PageHeader_1.PageHeader title="Reports" description={`${reports.length} total reports`}/>
      <DataTable_1.DataTable columns={columns} data={reports} loading={loading} emptyMessage="No reports found." onRowClick={(r) => router.push(`/reports/${r.id}`)}/>
    </div>);
}
