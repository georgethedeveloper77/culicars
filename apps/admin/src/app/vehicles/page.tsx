// apps/admin/src/app/vehicles/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Vehicle } from '@/types/admin.types';

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback((q: string) => {
    setLoading(true);
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    apiGet<Vehicle[]>(`/admin/vehicles${qs}`)
      .then(setVehicles)
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
      key: 'vin',
      header: 'VIN',
      render: (v: Vehicle) => (
        <span className="font-mono text-xs text-zinc-400">{v.vin}</span>
      ),
      width: '200px',
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (v: Vehicle) => (
        <div>
          <p className="font-semibold text-zinc-200">
            {v.year} {v.make} {v.model}
          </p>
          <p className="text-xs text-zinc-500">{v.color ?? '—'} · {v.fuelType ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'engine',
      header: 'Engine',
      render: (v: Vehicle) => (
        <span className="text-sm text-zinc-400">{v.engineCc ? `${v.engineCc}cc` : '—'}</span>
      ),
      width: '90px',
    },
    {
      key: 'inspection',
      header: 'Inspection',
      render: (v: Vehicle) => {
        const color =
          v.inspectionStatus === 'passed' ? 'text-emerald-400' :
          v.inspectionStatus === 'failed' ? 'text-red-400' :
          'text-zinc-500';
        return <span className={`text-sm capitalize ${color}`}>{v.inspectionStatus ?? '—'}</span>;
      },
      width: '110px',
    },
    {
      key: 'ntsa',
      header: 'NTSA COR',
      render: (v: Vehicle) => (
        <span className={`text-xs px-2 py-0.5 rounded ${
          v.ntsaCorVerified
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-zinc-700 text-zinc-500'
        }`}>
          {v.ntsaCorVerified ? 'Verified' : 'Unverified'}
        </span>
      ),
      width: '110px',
    },
    {
      key: 'added',
      header: 'Added',
      render: (v: Vehicle) => (
        <span className="text-sm text-zinc-500">{new Date(v.createdAt).toLocaleDateString()}</span>
      ),
      width: '110px',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="All vehicles in the database"
      />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by VIN, plate, make, model…"
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
        data={vehicles as any}
        loading={loading}
        emptyMessage="No vehicles found."
        onRowClick={(v: any) => router.push(`/vehicles/${encodeURIComponent(v.vin)}`)}
      />
    </div>
  );
}
