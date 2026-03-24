"use strict";
// apps/admin/src/components/payments/ProviderToggle.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderToggle = ProviderToggle;
const react_1 = require("react");
const api_1 = require("@/lib/api");
const PROVIDER_ICONS = {
    mpesa: '🇰🇪',
    paypal: '🅿️',
    stripe: '💳',
    google_pay: '🔵',
    apple_iap: '🍎',
    revenuecat: '📱',
    card: '💳',
};
function ProviderToggle({ provider, onUpdate }) {
    const [enabled, setEnabled] = (0, react_1.useState)(provider.isEnabled);
    const [saving, setSaving] = (0, react_1.useState)(false);
    async function toggle() {
        setSaving(true);
        try {
            const updated = await (0, api_1.apiPatch)(`/payments/providers/${provider.id}`, { isEnabled: !enabled });
            setEnabled(!enabled);
            onUpdate?.(updated);
        }
        catch (e) {
            console.error(e);
        }
        finally {
            setSaving(false);
        }
    }
    return (<div className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-[#141414]">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{PROVIDER_ICONS[provider.slug] ?? '💰'}</span>
        <div>
          <p className="text-sm font-semibold text-zinc-200">{provider.name}</p>
          <p className="text-xs text-zinc-500 font-mono">{provider.slug}</p>
        </div>
      </div>

      <button onClick={toggle} disabled={saving} className={`relative inline-flex w-11 h-6 rounded-full transition-colors focus:outline-none disabled:opacity-50 ${enabled ? 'bg-[#D4A843]' : 'bg-zinc-700'}`} title={enabled ? 'Disable provider' : 'Enable provider'}>
        <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}/>
      </button>
    </div>);
}
