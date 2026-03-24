"use strict";
// apps/admin/src/app/vehicles/[vin]/page.tsx
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VehicleDetailPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const lucide_react_1 = require("lucide-react");
const api_1 = require("@/lib/api");
const PageHeader_1 = require("@/components/ui/PageHeader");
function VehicleDetailPage({ params }) {
    const vin = decodeURIComponent(params.vin);
    const [vehicle, setVehicle] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        (0, api_1.apiGet)(`/admin/vehicles/${vin}`)
            .then(setVehicle)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [vin]);
    if (loading) {
        return <div className="h-64 bg-white/4 rounded-xl animate-pulse"/>;
    }
    if (!vehicle) {
        return <div className="text-zinc-500">Vehicle not found.</div>;
    }
    const SPECS = [
        ['Make', vehicle.make],
        ['Model', vehicle.model],
        ['Year', vehicle.year],
        ['Color', vehicle.color],
        ['Engine CC', vehicle.engineCc ? `${vehicle.engineCc}cc` : '—'],
        ['Fuel Type', vehicle.fuelType],
        ['Transmission', vehicle.transmission],
        ['Body Type', vehicle.bodyType],
        ['Inspection', vehicle.inspectionStatus],
        ['Caveat', vehicle.caveatStatus],
        ['NTSA Verified', vehicle.ntsaCorVerified ? 'Yes ✓' : 'No'],
        ['Added', new Date(vehicle.createdAt).toLocaleDateString()],
    ];
    return (<div>
      <link_1.default href="/vehicles" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
        <lucide_react_1.ChevronLeft className="w-4 h-4"/>
        Back to Vehicles
      </link_1.default>

      <PageHeader_1.PageHeader title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} description={vehicle.vin} actions={vehicle.reportId ? (<link_1.default href={`/reports/${vehicle.reportId}`} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/6 hover:bg-white/10 text-sm font-medium text-zinc-300 border border-white/10 transition-colors">
              <lucide_react_1.ExternalLink className="w-4 h-4"/>
              View Report
            </link_1.default>) : undefined}/>

      <div className="grid grid-cols-3 gap-6">
        {/* Specs */}
        <div className="col-span-1">
          <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Specifications</h3>
            <dl className="space-y-2.5">
              {SPECS.map(([label, value]) => (<div key={String(label)} className="flex justify-between text-sm">
                  <dt className="text-zinc-500">{label}</dt>
                  <dd className="text-zinc-200 capitalize">{String(value ?? '—')}</dd>
                </div>))}
            </dl>
          </div>
        </div>

        <div className="col-span-2 space-y-6">
          {/* Plates */}
          <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">
              Plate Mappings ({vehicle.plates?.length ?? 0})
            </h3>
            {(vehicle.plates ?? []).length === 0 ? (<p className="text-sm text-zinc-600">No plate mappings found.</p>) : (<div className="space-y-2">
                {vehicle.plates.map((p) => (<div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <span className="font-mono font-bold text-zinc-100">{p.plateDisplay ?? p.plate}</span>
                      <span className="ml-3 text-xs text-zinc-500 capitalize">{p.source.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold ${p.confidence >= 0.9 ? 'text-emerald-400' :
                    p.confidence >= 0.6 ? 'text-amber-400' : 'text-zinc-400'}`}>
                        {(p.confidence * 100).toFixed(0)}%
                      </span>
                      {p.verifiedAt && (<span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">Verified</span>)}
                    </div>
                  </div>))}
              </div>)}
          </div>

          {/* Events timeline */}
          <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">
              Event Timeline ({vehicle.events?.length ?? 0})
            </h3>
            {(vehicle.events ?? []).length === 0 ? (<p className="text-sm text-zinc-600">No events recorded.</p>) : (<div className="space-y-3">
                {vehicle.events
                .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
                .map((ev) => (<div key={ev.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#D4A843] mt-1.5 flex-shrink-0"/>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-200">
                            {ev.eventType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-zinc-500">{ev.eventDate}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {ev.county && `${ev.county} · `}
                          {ev.source.replace(/_/g, ' ')}
                          {' · '}
                          {(ev.confidence * 100).toFixed(0)}% confidence
                        </p>
                      </div>
                    </div>))}
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
