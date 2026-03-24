"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Badge = Badge;
exports.RiskBadge = RiskBadge;
exports.ReportStatusBadge = ReportStatusBadge;
exports.ContribStatusBadge = ContribStatusBadge;
exports.StolenStatusBadge = StolenStatusBadge;
exports.JobStatusBadge = JobStatusBadge;
exports.PayStatusBadge = PayStatusBadge;
function Badge({ label, className = '' }) {
    return (<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${className}`}>
      {label}
    </span>);
}
function RiskBadge({ level }) {
    const map = {
        clean: { label: 'CLEAN', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
        low: { label: 'LOW', cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
        medium: { label: 'MEDIUM', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
        high: { label: 'HIGH', cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/30' },
        critical: { label: 'CRITICAL', cls: 'bg-red-500/15 text-red-400 border border-red-500/30' },
    };
    const { label, cls } = map[level] ?? map.clean;
    return <Badge label={label} className={cls}/>;
}
function ReportStatusBadge({ status }) {
    const map = {
        draft: { cls: 'bg-zinc-700 text-zinc-300' },
        ready: { cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
        stale: { cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
    };
    return <Badge label={status} className={map[status]?.cls ?? ''}/>;
}
function ContribStatusBadge({ status }) {
    const map = {
        pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        approved: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        rejected: 'bg-red-500/15 text-red-400 border border-red-500/30',
        flagged: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    };
    return <Badge label={status} className={map[status] ?? ''}/>;
}
function StolenStatusBadge({ status }) {
    const map = {
        pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        active: 'bg-red-500/15 text-red-400 border border-red-500/30',
        recovered: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        rejected: 'bg-zinc-700 text-zinc-400',
        duplicate: 'bg-zinc-700 text-zinc-400',
    };
    return <Badge label={status} className={map[status] ?? ''}/>;
}
function JobStatusBadge({ status }) {
    const map = {
        queued: 'bg-zinc-700 text-zinc-300',
        running: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
        completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        failed: 'bg-red-500/15 text-red-400 border border-red-500/30',
    };
    return <Badge label={status} className={map[status] ?? ''}/>;
}
function PayStatusBadge({ status }) {
    const map = {
        pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        failed: 'bg-red-500/15 text-red-400 border border-red-500/30',
        refunded: 'bg-zinc-700 text-zinc-300',
    };
    return <Badge label={status} className={map[status] ?? ''}/>;
}
