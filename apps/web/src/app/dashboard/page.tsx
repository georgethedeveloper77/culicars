// apps/web/src/app/dashboard/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.culicars.com';

type RelationshipType = 'owner' | 'driver' | 'tracker' | 'watchlist';

interface UserVehicle {
  id: string;
  plate: string | null;
  vin: string | null;
  relationship_type: RelationshipType;
  nickname: string | null;
  alert_radius_km: number;
  created_at: string;
}

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  owner: 'Owner',
  driver: 'Driver',
  tracker: 'Tracking',
  watchlist: 'Watchlist',
};

const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  owner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  driver: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  tracker: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  watchlist: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

function AddVehicleModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [plate, setPlate] = useState('');
  const [vin, setVin] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('owner');
  const [nickname, setNickname] = useState('');
  const [alertRadius, setAlertRadius] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!plate.trim() && !vin.trim()) {
      setError('Enter a plate number or VIN.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/user/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plate: plate.trim() || undefined,
          vin: vin.trim() || undefined,
          relationshipType,
          nickname: nickname.trim() || undefined,
          alertRadiusKm: alertRadius,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add vehicle');
      onAdded();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Add Vehicle
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Number Plate
            </label>
            <input
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C8A84B]"
              placeholder="e.g. KDA 123A"
              value={plate}
              onChange={e => setPlate(e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              VIN <span className="text-zinc-400">(optional if plate provided)</span>
            </label>
            <input
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C8A84B]"
              placeholder="17-character VIN"
              value={vin}
              onChange={e => setVin(e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Relationship
            </label>
            <select
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C8A84B]"
              value={relationshipType}
              onChange={e => setRelationshipType(e.target.value as RelationshipType)}
            >
              <option value="owner">Owner</option>
              <option value="driver">Driver</option>
              <option value="tracker">Tracking</option>
              <option value="watchlist">Watchlist</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nickname <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#C8A84B]"
              placeholder="e.g. Family Car"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Alert Radius: {alertRadius} km
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={alertRadius}
              onChange={e => setAlertRadius(Number(e.target.value))}
              className="w-full accent-[#C8A84B]"
            />
            <div className="flex justify-between text-xs text-zinc-400 mt-1">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-lg bg-[#C8A84B] py-2 text-sm font-semibold text-white hover:bg-[#b8973f] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Adding…' : 'Add Vehicle'}
          </button>
        </div>
      </div>
    </div>
  );
}

function VehicleCard({
  vehicle,
  onDelete,
}: {
  vehicle: UserVehicle;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Remove this vehicle from your list?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/user/vehicles/${vehicle.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) onDelete(vehicle.id);
    } finally {
      setDeleting(false);
    }
  }

  const label = vehicle.nickname ?? vehicle.plate ?? vehicle.vin ?? 'Unknown';
  const sub = vehicle.nickname ? (vehicle.plate ?? vehicle.vin) : undefined;

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Car icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 16H6a2 2 0 01-2-2v-1.268a2 2 0 01.586-1.414l2-2A2 2 0 018 9h8a2 2 0 011.414.586l2 2A2 2 0 0120 13v1a2 2 0 01-2 2h-2m-8 0h8m-8 0a2 2 0 104 0m4 0a2 2 0 104 0" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-zinc-900 dark:text-white text-sm">{label}</p>
          {sub && <p className="text-xs text-zinc-400">{sub}</p>}
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${RELATIONSHIP_COLORS[vehicle.relationship_type]}`}>
              {RELATIONSHIP_LABELS[vehicle.relationship_type]}
            </span>
            <span className="text-xs text-zinc-400">{vehicle.alert_radius_km} km alert</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {vehicle.plate && (
          <Link
            href={`/report?q=${vehicle.plate}`}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            View Report
          </Link>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Remove"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch(`${API}/user/vehicles`, { credentials: 'include' });
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      setVehicles(data.vehicles ?? []);
    } catch {
      setError('Could not load your vehicles.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  function handleDelete(id: string) {
    setVehicles(prev => prev.filter(v => v.id !== id));
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">My Vehicles</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Vehicles you own, drive, or are watching.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#C8A84B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8973f] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Vehicle
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 py-16 px-8 text-center">
            <svg className="mb-4 h-12 w-12 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M8 16H6a2 2 0 01-2-2v-1.268a2 2 0 01.586-1.414l2-2A2 2 0 018 9h8a2 2 0 011.414.586l2 2A2 2 0 0120 13v1a2 2 0 01-2 2h-2m-8 0h8m-8 0a2 2 0 104 0m4 0a2 2 0 104 0" />
            </svg>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No vehicles yet</p>
            <p className="mt-1 text-xs text-zinc-400">Add a vehicle to get alerts and quick access to reports.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 rounded-lg bg-[#C8A84B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8973f] transition-colors"
            >
              Add your first vehicle
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map(v => (
              <VehicleCard key={v.id} vehicle={v} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Quick search shortcut */}
        <div className="mt-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">Search a vehicle</p>
          <p className="mt-0.5 text-xs text-zinc-400">Run a vehicle check by plate or VIN</p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#C8A84B] hover:underline"
          >
            Go to search →
          </Link>
        </div>
      </div>

      {showAdd && (
        <AddVehicleModal
          onClose={() => setShowAdd(false)}
          onAdded={fetchVehicles}
        />
      )}
    </main>
  );
}
