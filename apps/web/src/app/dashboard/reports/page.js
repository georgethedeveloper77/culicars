"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardReportsPage;
// apps/web/src/app/dashboard/reports/page.tsx
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const auth_context_1 = require("@/lib/auth-context");
function DashboardReportsPage() {
    const { token } = (0, auth_context_1.useAuth)();
    const [reports, setReports] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!token)
            return;
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.culicars.com'}/reports/unlocked`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(d => setReports(d.reports || []))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [token]);
    const RISK_PILL = {
        clean: 'bg-emerald-500/10 text-emerald-400',
        low: 'bg-blue-500/10 text-blue-400',
        medium: 'bg-amber-500/10 text-amber-400',
        high: 'bg-orange-500/10 text-orange-400',
        critical: 'bg-red-600/10 text-red-400',
    };
    return (<div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cc-text">My Reports</h1>
        <link_1.default href="/" className="cc-btn-secondary text-sm">
          + Search new vehicle
        </link_1.default>
      </div>

      {loading && (<div className="space-y-3">
          {[1, 2, 3].map(i => (<div key={i} className="cc-card p-5 animate-pulse">
              <div className="h-4 bg-cc-surface-2 rounded w-1/3 mb-2"/>
              <div className="h-3 bg-cc-surface-2 rounded w-1/2"/>
            </div>))}
        </div>)}

      {error && (<div className="cc-card p-6 text-center text-cc-muted">
          <p className="text-red-400 text-sm">{error}</p>
        </div>)}

      {!loading && !error && reports.length === 0 && (<div className="cc-card p-10 text-center">
          <span className="text-4xl block mb-3">📋</span>
          <h3 className="font-semibold text-cc-text mb-2">No unlocked reports yet</h3>
          <p className="text-cc-muted text-sm mb-6">
            Search a vehicle and use 1 credit to unlock its full history report.
          </p>
          <link_1.default href="/" className="cc-btn-primary">Search a vehicle →</link_1.default>
        </div>)}

      {!loading && reports.length > 0 && (<div className="space-y-3">
          {reports.map(r => (<link_1.default key={r.id} href={`/report/${r.id}`} className="cc-card p-5 flex items-center justify-between gap-4 hover:border-cc-accent/30 transition-colors group">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-cc-surface-2 border border-cc-border flex items-center justify-center text-lg shrink-0">
                  🚗
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-cc-text">
                      {r.vehicle.year} {r.vehicle.make} {r.vehicle.model}
                    </p>
                    <span className={`cc-pill text-xs capitalize ${RISK_PILL[r.vehicle.riskLevel] || RISK_PILL.clean}`}>
                      {r.vehicle.riskLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="font-mono text-xs text-cc-muted bg-cc-surface-2 px-1.5 py-0.5 rounded">
                      {r.vehicle.plateDisplay}
                    </span>
                    <span className="text-xs text-cc-faint">
                      Unlocked {new Date(r.unlockedAt).toLocaleDateString('en-KE', {
                    day: 'numeric', month: 'short', year: 'numeric',
                })}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-cc-muted group-hover:text-cc-accent transition-colors shrink-0 text-sm">View →</span>
            </link_1.default>))}
        </div>)}
    </div>);
}
