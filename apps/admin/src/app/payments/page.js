"use strict";
// apps/admin/src/app/payments/page.tsx
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PaymentsPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const api_1 = require("@/lib/api");
const PageHeader_1 = require("@/components/ui/PageHeader");
const DataTable_1 = require("@/components/ui/DataTable");
const StatusBadge_1 = require("@/components/ui/StatusBadge");
const STATUSES = ['all', 'pending', 'success', 'failed', 'refunded'];
const PROVIDER_LABELS = {
    mpesa: 'M-Pesa', paypal: 'PayPal', stripe: 'Stripe',
    google_pay: 'Google Pay', apple_iap: 'Apple IAP', revenuecat: 'RevenueCat', card: 'Card',
};
function PaymentsPage() {
    const [payments, setPayments] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [statusFilter, setStatusFilter] = (0, react_1.useState)('all');
    (0, react_1.useEffect)(() => {
        setLoading(true);
        const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
        (0, api_1.apiGet)(`/payments${qs}`)
            .then(setPayments)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [statusFilter]);
    const totalRevenue = payments
        .filter((p) => p.status === 'success')
        .reduce((sum, p) => sum + p.amount, 0);
    const columns = [
        {
            key: 'user',
            header: 'User',
            render: (p) => (<span className="text-sm text-zinc-300">{p.user?.email ?? p.userId.slice(0, 12) + '…'}</span>),
        },
        {
            key: 'provider',
            header: 'Provider',
            render: (p) => (<span className="text-sm text-zinc-300">{PROVIDER_LABELS[p.provider] ?? p.provider}</span>),
            width: '110px',
        },
        {
            key: 'amount',
            header: 'Amount',
            render: (p) => (<span className="text-sm font-semibold text-zinc-200">
          {p.currency} {(p.amount / 100).toLocaleString()}
        </span>),
            width: '120px',
        },
        {
            key: 'credits',
            header: 'Credits',
            render: (p) => (<span className="text-sm text-zinc-400">{p.credits} cr</span>),
            width: '80px',
        },
        {
            key: 'status',
            header: 'Status',
            render: (p) => <StatusBadge_1.PayStatusBadge status={p.status}/>,
            width: '100px',
        },
        {
            key: 'ref',
            header: 'Ref',
            render: (p) => (<span className="text-xs font-mono text-zinc-500 truncate max-w-[120px] block">
          {p.providerRef ?? '—'}
        </span>),
        },
        {
            key: 'createdAt',
            header: 'Date',
            render: (p) => (<span className="text-sm text-zinc-500">{new Date(p.createdAt).toLocaleString()}</span>),
            width: '170px',
        },
    ];
    return (<div>
      <PageHeader_1.PageHeader title="Payments" description="All payment transactions" actions={<link_1.default href="/payments/providers" className="px-4 py-2 rounded-lg bg-white/6 hover:bg-white/10 text-sm font-medium text-zinc-300 transition-colors border border-white/10">
            Manage Providers
          </link_1.default>}/>

      {/* Revenue strip */}
      <div className="flex gap-4 mb-6">
        {[
            { label: 'Total Revenue (KES)', value: `KSh ${(totalRevenue / 100).toLocaleString()}` },
            { label: 'Successful', value: payments.filter((p) => p.status === 'success').length },
            { label: 'Pending', value: payments.filter((p) => p.status === 'pending').length },
            { label: 'Failed', value: payments.filter((p) => p.status === 'failed').length },
        ].map(({ label, value }) => (<div key={label} className="px-5 py-3 rounded-xl border border-white/8 bg-[#141414] flex items-center gap-3">
            <span className="text-xs text-zinc-500">{label}</span>
            <span className="text-lg font-bold text-zinc-100">{value}</span>
          </div>))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-white/4 rounded-lg p-1 w-fit">
        {STATUSES.map((s) => (<button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${statusFilter === s ? 'bg-[#D4A843] text-black' : 'text-zinc-400 hover:text-zinc-200'}`}>
            {s}
          </button>))}
      </div>

      <DataTable_1.DataTable columns={columns} data={payments} loading={loading} emptyMessage="No payments found."/>
    </div>);
}
