"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NewReportPage;
// apps/web/src/app/report/new/page.tsx
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const api_1 = require("@/lib/api");
const auth_context_1 = require("@/lib/auth-context");
const react_2 = require("react");
function NewReportContent() {
    const searchParams = (0, navigation_1.useSearchParams)();
    const router = (0, navigation_1.useRouter)();
    const { token } = (0, auth_context_1.useAuth)();
    const vin = searchParams.get('vin') || '';
    const plate = searchParams.get('plate') || '';
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!vin)
            return;
        setLoading(true);
        (0, api_1.getReportByVin)(vin, token || undefined)
            .then(report => {
            router.replace(`/report/${report.id}`);
        })
            .catch(err => {
            setError(err.message || 'Could not generate report');
            setLoading(false);
        });
    }, [vin, token]);
    if (loading) {
        return (<div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-cc-border border-t-cc-accent animate-spin"/>
        <div className="text-center">
          <p className="text-cc-text font-medium">Generating report…</p>
          <p className="text-cc-muted text-sm mt-1">
            Checking 13 data sources for{' '}
            <span className="font-mono font-semibold">{plate || vin}</span>
          </p>
        </div>
        <div className="flex flex-col gap-1.5 mt-2 text-xs text-cc-faint text-center">
          {[
                'Checking NTSA records…',
                'Scanning KRA import data…',
                'Checking stolen vehicle reports…',
                'Analysing service history…',
            ].map((msg, i) => (<p key={i} className="fade-in" style={{ animationDelay: `${i * 0.8}s` }}>{msg}</p>))}
        </div>
      </div>);
    }
    if (error) {
        return (<div className="max-w-md mx-auto text-center py-20">
        <div className="cc-card p-8">
          <span className="text-4xl block mb-3">⚠</span>
          <h3 className="font-semibold text-cc-text mb-2">Report generation failed</h3>
          <p className="text-cc-muted text-sm mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <link_1.default href={`/search?q=${encodeURIComponent(plate || vin)}`} className="cc-btn-secondary">
              ← Back to search results
            </link_1.default>
            <link_1.default href={`/contribute/${vin}`} className="text-sm text-cc-muted hover:text-cc-text transition-colors">
              Contribute data for this vehicle
            </link_1.default>
          </div>
        </div>
      </div>);
    }
    // No VIN — show entry form
    return (<div className="max-w-lg mx-auto py-16 px-4">
      <h1 className="text-2xl font-bold text-cc-text mb-2">Get a Vehicle Report</h1>
      <p className="text-cc-muted mb-8">Enter a plate or VIN to start.</p>
      <link_1.default href="/" className="cc-btn-secondary w-full text-center">
        ← Search from homepage
      </link_1.default>
    </div>);
}
function NewReportPage() {
    return (<div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <react_2.Suspense fallback={<div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-cc-border border-t-cc-accent animate-spin"/>
        </div>}>
        <NewReportContent />
      </react_2.Suspense>
    </div>);
}
