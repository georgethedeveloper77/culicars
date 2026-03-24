// apps/admin/src/components/payments/ProviderToggle.tsx
'use client';

import { useState } from 'react';
import { apiPatch } from '@/lib/api';
import type { PaymentProvider } from '@/types/admin.types';

interface ProviderToggleProps {
  provider: PaymentProvider;
  onUpdate?: (updated: PaymentProvider) => void;
}

const PROVIDER_ICONS: Record<string, string> = {
  mpesa:       '🇰🇪',
  paypal:      '🅿️',
  stripe:      '💳',
  google_pay:  '🔵',
  apple_iap:   '🍎',
  revenuecat:  '📱',
  card:        '💳',
};

export function ProviderToggle({ provider, onUpdate }: ProviderToggleProps) {
  const [enabled, setEnabled] = useState(provider.isEnabled);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    try {
      const updated = await apiPatch<PaymentProvider>(
        `/payments/providers/${provider.id}`,
        { isEnabled: !enabled }
      );
      setEnabled(!enabled);
      onUpdate?.(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-[#141414]">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{PROVIDER_ICONS[provider.slug] ?? '💰'}</span>
        <div>
          <p className="text-sm font-semibold text-zinc-200">{provider.name}</p>
          <p className="text-xs text-zinc-500 font-mono">{provider.slug}</p>
        </div>
      </div>

      <button
        onClick={toggle}
        disabled={saving}
        className={`relative inline-flex w-11 h-6 rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          enabled ? 'bg-[#D4A843]' : 'bg-zinc-700'
        }`}
        title={enabled ? 'Disable provider' : 'Enable provider'}
      >
        <span
          className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
