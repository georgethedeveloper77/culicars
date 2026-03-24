"use strict";
// apps/admin/src/app/vehicles/page.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VehiclesPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const api_1 = require("@/lib/api");
const PageHeader_1 = require("@/components/ui/PageHeader");
const DataTable_1 = require("@/components/ui/DataTable");
function VehiclesPage() {
    const router = (0, navigation_1.useRouter)();
    const [vehicles, setVehicles] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [query, setQuery] = (0, react_1.useState)('');
    const load = (0, react_1.useCallback)((q) => {
        setLoading(true);
        const qs = q ? `?q=${encodeURIComponent(q)}` : '';
        (0, api_1.apiGet)(`/admin/vehicles${qs}`)
            .then(setVehicles)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);
    (0, react_1.useEffect)(() => { load(''); }, [load]);
    function handleSearch(e) {
        e.preventDefault();
        load(query);
    }
    const columns = [
        {
            key: 'vin',
            header: 'VIN',
            render: (v) => (<span className="font-mono text-xs text-zinc-400">{v.vin}</span>),
            width: '200px',
        },
        {
            key: 'vehicle',
            header: 'Vehicle',
            render: (v) => (<div>
          <p className="font-semibold text-zinc-200">
            {v.year} {v.make} {v.model}
          </p>
          <p className="text-xs text-zinc-500">{v.color ?? '—'} · {v.fuelType ?? '—'}</p>
        </div>),
        },
        {
            key: 'engine',
            header: 'Engine',
            render: (v) => (<span className="text-sm text-zinc-400">{v.engineCc ? `${v.engineCc}cc` : '—'}</span>),
            width: '90px',
        },
        {
            key: 'inspection',
            header: 'Inspection',
            render: (v) => {
                const color = v.inspectionStatus === 'passed' ? 'text-emerald-400' :
                    v.inspectionStatus === 'failed' ? 'text-red-400' :
                        'text-zinc-500';
                return <span className={`text-sm capitalize ${color}`}>{v.inspectionStatus ?? '—'}</span>;
            },
            width: '110px',
        },
        {
            key: 'ntsa',
            header: 'NTSA COR',
            render: (v) => (<span className={`text-xs px-2 py-0.5 rounded ${v.ntsaCorVerified
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-zinc-700 text-zinc-500'}`}>
          {v.ntsaCorVerified ? 'Verified' : 'Unverified'}
        </span>),
            width: '110px',
        },
        {
            key: 'added',
            header: 'Added',
            render: (v) => (<span className="text-sm text-zinc-500">{new Date(v.createdAt).toLocaleDateString()}</span>),
            width: '110px',
        },
    ];
    return (<div>
      <PageHeader_1.PageHeader title="Vehicles" description="All vehicles in the database"/>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <lucide_react_1.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by VIN, plate, make, model…" className="w-full bg-[#141414] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#D4A843]/50"/>
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg bg-[#D4A843] hover:bg-[#E8C060] text-black text-sm font-semibold transition-colors">
          Search
        </button>
      </form>

      <DataTable_1.DataTable columns={columns} data={vehicles} loading={loading} emptyMessage="No vehicles found." onRowClick={(v) => router.push(`/vehicles/${encodeURIComponent(v.vin)}`)}/>
    </div>);
}
