"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SearchPage;
// apps/web/src/app/search/page.tsx
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const api_1 = require("@/lib/api");
const SearchBar_1 = require("@/components/shared/SearchBar");
const StolenReportBanner_1 = require("@/components/report/StolenReportBanner");
function SearchResults() {
    const searchParams = (0, navigation_1.useSearchParams)();
    const router = (0, navigation_1.useRouter)();
    const q = searchParams.get('q') || '';
    const [result, setResult] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!q)
            return;
        setLoading(true);
        setError(null);
        (0, api_1.searchVehicles)(q)
            .then(data => setResult(data))
            .catch(err => setError(err.message || 'Search failed'))
            .finally(() => setLoading(false));
    }, [q]);
    if (!q) {
        return (<div className="text-center py-20 text-cc-muted">
        <p>Enter a plate or VIN to search.</p>
        <link_1.default href="/" className="cc-btn-secondary mt-4 inline-flex">← Back to home</link_1.default>
      </div>);
    }
    return (<div className="max-w-3xl mx-auto">
      {/* Refined search bar */}
      <div className="mb-6">
        <SearchBar_1.SearchBar defaultValue={q}/>
      </div>

      {/* Loading */}
      {loading && (<div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-cc-border border-t-cc-accent animate-spin"/>
          <p className="text-cc-muted text-sm">Checking {q} across 13 sources…</p>
        </div>)}

      {/* Error */}
      {error && !loading && (<div className="cc-card border-red-900/40 p-6 text-center">
          <p className="text-red-400 font-medium mb-2">Search failed</p>
          <p className="text-cc-muted text-sm">{error}</p>
          <button onClick={() => router.back()} className="cc-btn-secondary mt-4">Go back</button>
        </div>)}

      {/* Results */}
      {result && !loading && (<div className="fade-in space-y-4">
          {/* Stolen alert — always first */}
          {(result.stolenAlert.active || result.stolenAlert.hasActiveReport) && (<StolenReportBanner_1.StolenReportBanner alert={{
                    active: result.stolenAlert.active || result.stolenAlert.hasActiveReport || false,
                    date: result.stolenAlert.date || result.stolenAlert.reports?.[0]?.dateStolenIso,
                    county: result.stolenAlert.county || result.stolenAlert.reports?.[0]?.countyStolen,
                    obNumber: result.stolenAlert.obNumber || result.stolenAlert.reports?.[0]?.policeObNumber || undefined,
                }} plate={q}/>)}

          {/* Query type badge */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-cc-muted">
              Results for{' '}
              <span className="font-mono font-semibold text-cc-text bg-cc-surface-2 px-2 py-0.5 rounded">
                {q}
              </span>
              {' '}·{' '}
              <span className="text-xs capitalize">{result.queryType} search</span>
            </p>
            <span className="text-xs text-cc-muted">{result.candidates.length} result{result.candidates.length !== 1 ? 's' : ''}</span>
          </div>

          {/* No results */}
          {result.candidates.length === 0 && (<div className="cc-card p-8 text-center">
              <div className="text-4xl mb-3">🔎</div>
              <h3 className="font-semibold text-cc-text mb-2">No vehicle found</h3>
              <p className="text-cc-muted text-sm mb-4">
                No records match <span className="font-mono font-semibold">{q}</span> in our database.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <link_1.default href="/contribute" className="cc-btn-secondary text-sm">
                  Contribute data for this vehicle
                </link_1.default>
                <link_1.default href="/report-stolen" className="cc-btn-secondary text-sm">
                  Report it stolen
                </link_1.default>
              </div>
            </div>)}

          {/* Candidate cards */}
          {result.candidates.map(c => (<CandidateCard key={c.vin} candidate={c}/>))}

          {/* No stolen alert — show clean badge */}
          {!result.stolenAlert.active && result.candidates.length > 0 && (<div className="flex items-center gap-2 text-emerald-400 text-sm px-1">
              <span>✓</span>
              <span>No active stolen reports found for this plate</span>
              <span className="cc-pill bg-emerald-500/10 text-emerald-400 text-xs">Free check</span>
            </div>)}
        </div>)}
    </div>);
}
function CandidateCard({ candidate: c }) {
    const v = c.vehicle;
    return (<div className="cc-card p-5 hover:border-cc-accent/30 transition-colors group">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Vehicle info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h3 className="font-semibold text-lg text-cc-text">
              {v?.year} {v?.make} {v?.model}
            </h3>
            {v?.ntsaCorVerified && (<span className="cc-pill bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                🏛️ NTSA Verified
              </span>)}
          </div>

          {/* Plate + VIN */}
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <span className="plate-badge">{c.plateDisplay}</span>
            <span className="font-mono text-xs text-cc-faint">{c.vin}</span>
          </div>

          {/* Specs row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-cc-muted">
            {v?.bodyType && <span>{v?.bodyType}</span>}
            {v?.engineCc && <span>{v?.engineCc}cc</span>}
            {v?.fuelType && <span>{v?.fuelType}</span>}
            {v?.transmission && <span>{v?.transmission}</span>}
            {v?.color && <span>{v?.color}</span>}
          </div>

          {/* Confidence */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1 bg-cc-border rounded-full max-w-[120px]">
              <div className="h-1 rounded-full bg-cc-accent transition-all" style={{ width: `${Math.round(c.confidence * 100)}%` }}/>
            </div>
            <span className="text-xs text-cc-muted">
              {Math.round(c.confidence * 100)}% confidence
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0 flex flex-col gap-2">
          {c.reportId ? (<link_1.default href={`/report/${c.reportId}`} className="cc-btn-primary">
              View Report →
            </link_1.default>) : (<link_1.default href={`/report/new?vin=${encodeURIComponent(c.vin)}&plate=${encodeURIComponent(c.plate ?? "")}`} className="cc-btn-primary">
              Generate Report →
            </link_1.default>)}
          <link_1.default href={`/contribute/${c.vin}`} className="text-xs text-center text-cc-muted hover:text-cc-text transition-colors">
            Contribute data
          </link_1.default>
        </div>
      </div>
    </div>);
}
function SearchPage() {
    return (<div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <react_1.Suspense fallback={<div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-cc-border border-t-cc-accent animate-spin"/>
        </div>}>
        <SearchResults />
      </react_1.Suspense>
    </div>);
}
