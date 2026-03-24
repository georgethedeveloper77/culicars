// apps/admin/src/app/users/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/StatusBadge';
import { CreditGrantForm } from '@/components/users/CreditGrantForm';
import type { AdminUser, CreditLedgerEntry } from '@/types/admin.types';

const ROLE_COLORS: Record<string, string> = {
  admin:  'bg-[#D4A843]/15 text-[#D4A843] border border-[#D4A843]/30',
  dealer: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  user:   'bg-zinc-700 text-zinc-300',
  guest:  'bg-zinc-800 text-zinc-500',
};

const LEDGER_TYPE_COLORS: Record<string, string> = {
  purchase:     'text-emerald-400',
  spend:        'text-red-400',
  bonus:        'text-[#D4A843]',
  refund:       'text-blue-400',
  admin_grant:  'text-purple-400',
  admin_deduct: 'text-orange-400',
};

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet<AdminUser>(`/users/${params.id}`),
      apiGet<CreditLedgerEntry[]>(`/credits/ledger?userId=${params.id}`),
    ])
      .then(([u, l]) => {
        setUser(u);
        setBalance(u.wallet?.balance ?? 0);
        setLedger(l);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <div className="h-64 bg-white/4 rounded-xl animate-pulse" />;
  }
  if (!user) {
    return <div className="text-zinc-500">User not found.</div>;
  }

  return (
    <div>
      <Link
        href="/users"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Users
      </Link>

      <PageHeader
        title={user.profile?.displayName ?? user.email}
        description={user.email}
        actions={<Badge label={user.role} className={ROLE_COLORS[user.role] ?? ''} />}
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Profile */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Profile</h3>
            <dl className="space-y-2.5 text-sm">
              {[
                ['Email', user.email],
                ['Display Name', user.profile?.displayName ?? '—'],
                ['Phone', user.profile?.phone ?? '—'],
                ['County', user.profile?.county ?? '—'],
                ['Role', user.role],
                ['Joined', new Date(user.createdAt).toLocaleDateString()],
              ].map(([label, value]) => (
                <div key={String(label)} className="flex justify-between">
                  <dt className="text-zinc-500">{label}</dt>
                  <dd className="text-zinc-200 capitalize">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <CreditGrantForm
            userId={user.id!}
            currentBalance={balance}
            onGranted={setBalance}
          />
        </div>

        {/* Ledger */}
        <div className="col-span-2">
          <div className="rounded-xl border border-white/8 bg-[#141414] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/6 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-300">Credit Ledger</h3>
              <span className="text-xs text-zinc-500">{ledger.length} entries</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/3 border-b border-white/6">
                    {['Type', 'Delta', 'Before', 'After', 'Source', 'Date'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs text-zinc-500 uppercase tracking-widest font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-zinc-600 text-sm">
                        No ledger entries yet.
                      </td>
                    </tr>
                  ) : (
                    ledger.map((entry) => (
                      <tr key={entry.id} className="border-b border-white/5 last:border-0">
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold capitalize ${LEDGER_TYPE_COLORS[entry.type] ?? 'text-zinc-400'}`}>
                            {entry.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`font-bold font-mono ${entry.creditsDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {entry.creditsDelta > 0 ? '+' : ''}{entry.creditsDelta}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-zinc-400 font-mono">{entry.balanceBefore}</td>
                        <td className="px-5 py-3 text-zinc-200 font-mono font-semibold">{entry.balanceAfter}</td>
                        <td className="px-5 py-3 text-zinc-500 text-xs max-w-[140px] truncate">
                          {entry.source ?? entry.txRef ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-zinc-500 text-xs whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
