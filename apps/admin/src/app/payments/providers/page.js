"use strict";
// apps/admin/src/app/payments/providers/page.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProvidersPage;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const api_1 = require("@/lib/api");
const PageHeader_1 = require("@/components/ui/PageHeader");
const ProviderToggle_1 = require("@/components/payments/ProviderToggle");
const ProviderConfig_1 = require("@/components/payments/ProviderConfig");
function ProvidersPage() {
    const [providers, setProviders] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [expanded, setExpanded] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        (0, api_1.apiGet)('/payments/providers?all=true')
            .then(setProviders)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);
    function handleUpdate(updated) {
        setProviders((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    }
    if (loading) {
        return (<div>
        <PageHeader_1.PageHeader title="Payment Providers" description="Toggle and configure payment methods"/>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (<div key={i} className="h-16 bg-white/4 rounded-xl animate-pulse"/>))}
        </div>
      </div>);
    }
    const enabledCount = providers.filter((p) => p.isEnabled).length;
    return (<div>
      <PageHeader_1.PageHeader title="Payment Providers" description={`${enabledCount} of ${providers.length} providers enabled`}/>

      <div className="mb-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-sm text-amber-300">
        <strong>Note:</strong> M-Pesa is the primary provider for Kenya. PayPal does not accept KES — amounts are converted to USD during processing.
      </div>

      <div className="space-y-2">
        {providers.map((provider) => (<div key={provider.id} className="rounded-xl border border-white/8 bg-[#141414] overflow-hidden">
            <ProviderToggle_1.ProviderToggle provider={provider} onUpdate={handleUpdate}/>

            {/* Expand config */}
            <button onClick={() => setExpanded((e) => (e === provider.id ? null : provider.id))} className="w-full flex items-center justify-between px-5 py-2.5 text-xs text-zinc-500 hover:text-zinc-300 border-t border-white/6 transition-colors">
              <span>Configuration</span>
              {expanded === provider.id ? (<lucide_react_1.ChevronUp className="w-3.5 h-3.5"/>) : (<lucide_react_1.ChevronDown className="w-3.5 h-3.5"/>)}
            </button>

            {expanded === provider.id && (<div className="border-t border-white/6">
                <ProviderConfig_1.ProviderConfig provider={provider}/>
              </div>)}
          </div>))}
      </div>
    </div>);
}
