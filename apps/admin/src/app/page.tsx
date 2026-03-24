// apps/admin/src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, FileText, AlertTriangle, MessageSquare,
  DollarSign, Car, TrendingUp, Clock,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { RiskBadge, PayStatusBadge } from '@/components/ui/StatusBadge';
import type { DashboardStats } from '@/types/admin.types';

function fmt(n: number) {
  return n.toLocaleString();
}

function fmtKES(n: number) {
  return `KSh ${(n / 100).toLocaleString()}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<DashboardStats>('/admin/stats')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="CuliCars platform overview" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/4 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="CuliCars platform overview" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        <StatCard
          label="Total Users"
          value={fmt(stats?.totalUsers ?? 0)}
          icon={<Users className="w-5 h-5" />}
          accent="blue"
        />
        <StatCard
          label="Total Reports"
          value={fmt(stats?.totalReports ?? 0)}
          icon={<FileText className="w-5 h-5" />}
          accent="gold"
        />
        <StatCard
          label="Pending Contributions"
          value={fmt(stats?.pendingContributions ?? 0)}
          icon={<MessageSquare className="w-5 h-5" />}
          accent="amber"
          sub="Awaiting review"
        />
        <StatCard
          label="Pending Stolen Reports"
          value={fmt(stats?.pendingStolenReports ?? 0)}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="red"
          sub="Awaiting review"
        />
        <StatCard
          label="Total Revenue"
          value={fmtKES(stats?.totalRevenue ?? 0)}
          icon={<DollarSign className="w-5 h-5" />}
          accent="green"
        />
        <StatCard
          label="Vehicles in DB"
          value={fmt(stats?.activeVehicles ?? 0)}
          icon={<Car className="w-5 h-5" />}
          accent="blue"
        />
      </div>

      {/* Quick links for pending */}
      {((stats?.pendingContributions ?? 0) > 0 || (stats?.pendingStolenReports ?? 0) > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-10">
          {(stats?.pendingContributions ?? 0) > 0 && (
            <Link
              href="/contributions?status=pending"
              className="flex items-center gap-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                  {stats?.pendingContributions} pending contributions
                </p>
                <p className="text-xs text-zinc-500">Review now →</p>
              </div>
            </Link>
          )}
          {(stats?.pendingStolenReports ?? 0) > 0 && (
            <Link
              href="/stolen-reports?status=pending"
              className="flex items-center gap-4 p-4 rounded-xl border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                  {stats?.pendingStolenReports} stolen reports to review
                </p>
                <p className="text-xs text-zinc-500">Review now →</p>
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Reports */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Recent Reports</h2>
            <Link href="/reports" className="text-xs text-[#D4A843] hover:text-[#E8C060]">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {(stats?.recentReports ?? []).slice(0, 5).map((r) => (
              <Link
                key={r.id}
                href={`/reports/${r.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/6 hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {r.vehicle?.make} {r.vehicle?.model} {r.vehicle?.year}
                  </p>
                  <p className="text-xs text-zinc-500 font-mono">{r.vin}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <RiskBadge level={r.riskLevel} />
                </div>
              </Link>
            ))}
            {!stats?.recentReports?.length && (
              <p className="text-sm text-zinc-600 px-3">No reports yet.</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">Recent Payments</h2>
            <Link href="/payments" className="text-xs text-[#D4A843] hover:text-[#E8C060]">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {(stats?.recentPayments ?? []).slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/6"
              >
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
                  <PayStatusBadge status={p.status} />
                </div>
              </div>
            ))}
            {!stats?.recentPayments?.length && (
              <p className="text-sm text-zinc-600 px-3">No payments yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
