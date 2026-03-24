// apps/admin/src/app/users/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/StatusBadge';
import type { AdminUser } from '@/types/admin.types';

const ROLE_COLORS: Record<string, string> = {
  admin:  'bg-[#D4A843]/15 text-[#D4A843] border border-[#D4A843]/30',
  dealer: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  user:   'bg-zinc-700 text-zinc-300',
  guest:  'bg-zinc-800 text-zinc-500',
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback((q: string) => {
    setLoading(true);
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    apiGet<AdminUser[]>(`/users${qs}`)
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(''); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(query);
  }

  const columns = [
    {
      key: 'email',
      header: 'User',
      render: (u: AdminUser) => (
        <div>
          <p className="font-medium text-zinc-200">{u.email}</p>
          {u.profile?.displayName && (
            <p className="text-xs text-zinc-500 mt-0.5">{u.profile.displayName}</p>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u: AdminUser) => (
        <Badge label={u.role} className={ROLE_COLORS[u.role] ?? ''} />
      ),
      width: '100px',
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (u: AdminUser) => (
        <span className={`text-sm font-semibold ${
          (u.wallet?.balance ?? 0) > 0 ? 'text-[#D4A843]' : 'text-zinc-500'
        }`}>
          {u.wallet?.balance ?? 0} cr
        </span>
      ),
      width: '90px',
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (u: AdminUser) => (
        <span className="text-sm text-zinc-400">{u.profile?.phone ?? '—'}</span>
      ),
      width: '130px',
    },
    {
      key: 'county',
      header: 'County',
      render: (u: AdminUser) => (
        <span className="text-sm text-zinc-400">{u.profile?.county ?? '—'}</span>
      ),
      width: '110px',
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (u: AdminUser) => (
        <span className="text-sm text-zinc-500">{new Date(u.createdAt).toLocaleDateString()}</span>
      ),
      width: '110px',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${users.length} users registered`}
      />

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email, phone, name…"
            className="w-full bg-[#141414] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#D4A843]/50"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-[#D4A843] hover:bg-[#E8C060] text-black text-sm font-semibold transition-colors"
        >
          Search
        </button>
      </form>

      <DataTable
        columns={columns as any}
        data={users as any}
        loading={loading}
        emptyMessage="No users found."
        onRowClick={(u: any) => router.push(`/users/${u.id}`)}
      />
    </div>
  );
}
