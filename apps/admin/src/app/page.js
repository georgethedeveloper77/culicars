"use strict";
// apps/admin/src/app/page.tsx
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const api_1 = require("@/lib/api");
const StatCard_1 = require("@/components/ui/StatCard");
const PageHeader_1 = require("@/components/ui/PageHeader");
const StatusBadge_1 = require("@/components/ui/StatusBadge");
function fmt(n) {
    return n.toLocaleString();
}
function fmtKES(n) {
    return `KSh ${(n / 100).toLocaleString()}`;
}
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)
        return 'just now';
    if (m < 60)
        return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)
        return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}
function DashboardPage() {
    const [stats, setStats] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        (0, api_1.apiGet)('/admin/stats')
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);
    if (loading) {
        return (<div>
        <PageHeader_1.PageHeader title="Dashboard" description="CuliCars platform overview"/>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (<div key={i} className="h-24 rounded-xl bg-white/4 animate-pulse"/>))}
        </div>
      </div>);
    }
    return (<div>
      <PageHeader_1.PageHeader title="Dashboard" description="CuliCars platform overview"/>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <StatCard_1.StatCard label="Total Users" value={fmt(stats?.totalUsers ?? 0)} icon={<lucide_react_1.Users className="w-5 h-5"/>} accent="blue"/>
        <StatCard_1.StatCard label="Total Reports" value={fmt(stats?.totalReports ?? 0)} icon={<lucide_react_1.FileText className="w-5 h-5"/>} accent="gold"/>
        <StatCard_1.StatCard label="Pending Contributions" value={fmt(stats?.pendingContributions ?? 0)} icon={<lucide_react_1.MessageSquare className="w-5 h-5"/>} accent="amber" sub="Awaiting review"/>
        <StatCard_1.StatCard label="Pending Stolen Reports" value={fmt(stats?.pendingStolenReports ?? 0)} icon={<lucide_react_1.AlertTriangle className="w-5 h-5"/>} accent="red" sub="Awaiting review"/>
        <StatCard_1.StatCard label="Total Revenue" value={fmtKES(stats?.totalRevenue ?? 0)} icon={<lucide_react_1.DollarSign className="w-5 h-5"/>} accent="green"/>
        <StatCard_1.StatCard label="Vehicles in DB" value={fmt(stats?.activeVehicles ?? 0)} icon={<lucide_react_1.Car className="w-5 h-5"/>} accent="blue"/>
      </div>

      {/* Quick links for pending */}
      {((stats?.pendingContributions ?? 0) > 0 || (stats?.pendingStolenReports ?? 0) > 0) && (<div className="grid grid-cols-2 gap-4 mb-10">
          {(stats?.pendingContributions ?? 0) > 0 && (<link_1.default href="/contributions?status=pending" className="flex items-center gap-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                <lucide_react_1.MessageSquare className="w-5 h-5"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                  {stats?.pendingContributions} pending contributions
                </p>
                <p className="text-xs text-zinc-500">Review now →</p>
              </div>
            </link_1.default>)}
          {(stats?.pendingStolenReports ?? 0) > 0 && (<link_1.default href="/stolen-reports?status=pending" className="flex items-center gap-4 p-4 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400">
                <lucide_react_1.AlertTriangle className="w-5 h-5"/>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                  {stats?.pendingStolenReports} stolen reports to review
                </p>
                <p className="text-xs text-zinc-500">Review now →</p>
              </div>
            </link_1.default>)}
        </div>)}

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Reports */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Recent Reports</h2>
            <link_1.default href="/reports" className="text-xs text-[#D4A843] hover:text-[#E8C060]">
              View all →
            </link_1.default>
          </div>
          <div className="space-y-2">
            {(stats?.recentReports ?? []).slice(0, 5).map((r) => (<link_1.default key={r.id} href={`/reports/${r.id}`} className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/6 hover:bg-white/5 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {r.vehicle?.make} {r.vehicle?.model} {r.vehicle?.year}
                  </p>
                  <p className="text-xs text-zinc-500 font-mono">{r.vin}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <StatusBadge_1.RiskBadge level={r.riskLevel}/>
                </div>
              </link_1.default>))}
            {!stats?.recentReports?.length && (<p className="text-sm text-zinc-600 px-3">No reports yet.</p>)}
          </div>
        </div>

        {/* Recent Payments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Recent Payments</h2>
            <link_1.default href="/payments" className="text-xs text-[#D4A843] hover:text-[#E8C060]">
              View all →
            </link_1.default>
          </div>
          <div className="space-y-2">
            {(stats?.recentPayments ?? []).slice(0, 5).map((p) => (<div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/6">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {p.user?.email ?? p.userId.slice(0, 8)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {p.credits} credit{p.credits !== 1 ? 's' : ''} · {p.provider} · {timeAgo(p.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-emerald-400">
                    KSh {(p.amount / 100).toLocaleString()}
                  </span>
                  <StatusBadge_1.PayStatusBadge status={p.status}/>
                </div>
              </div>))}
            {!stats?.recentPayments?.length && (<p className="text-sm text-zinc-600 px-3">No payments yet.</p>)}
          </div>
        </div>
      </div>
    </div>);
}
