'use client';
// apps/web/src/app/dashboard/page.tsx

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getWalletBalance } from '@/lib/api';
import { SearchBar } from '@/components/shared/SearchBar';

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getWalletBalance(token)
      .then(d => setBalance(d.balance))
      .catch(() => setBalance(0))
      .finally(() => setBalanceLoading(false));
  }, [token]);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-cc-text">Dashboard</h1>
        <p className="text-cc-muted text-sm mt-1">Welcome back, {user?.email?.split('@')[0]}</p>
      </div>

      {/* Balance + quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Credits balance */}
        <div className="cc-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cc-accent/10 border border-cc-accent/20 flex items-center justify-center text-2xl shrink-0">
            💳
          </div>
          <div>
            <p className="text-xs text-cc-muted mb-1">Credit balance</p>
            {balanceLoading ? (
              <div className="h-6 w-12 bg-cc-surface-2 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold text-cc-text">{balance ?? 0}</p>
            )}
            <Link href="/dashboard/billing" className="text-xs text-cc-accent hover:underline mt-0.5 block">
              Buy credits →
            </Link>
          </div>
        </div>

        {/* Quick search */}
        <div className="sm:col-span-2 cc-card p-5">
          <p className="text-xs text-cc-muted mb-3">Quick search</p>
          <SearchBar placeholder="Search plate or VIN…" />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          {
            href: '/dashboard/reports',
            icon: '📋',
            title: 'My Reports',
            desc: 'View all vehicles you\'ve unlocked reports for',
          },
          {
            href: '/dashboard/billing',
            icon: '💳',
            title: 'Credits & Billing',
            desc: 'Buy credit packs and view transaction history',
          },
          {
            href: '/report-stolen',
            icon: '🚨',
            title: 'Report Stolen Vehicle',
            desc: 'Submit a community stolen vehicle report — free',
          },
          {
            href: '/contribute',
            icon: '👥',
            title: 'Contribute Data',
            desc: 'Submit service records, damage reports, or photos',
          },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="cc-card p-5 flex items-start gap-3 hover:border-cc-accent/30 transition-colors group"
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="font-medium text-cc-text group-hover:text-cc-accent transition-colors">{item.title}</p>
              <p className="text-cc-muted text-xs mt-0.5">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
