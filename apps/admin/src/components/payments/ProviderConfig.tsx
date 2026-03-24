// apps/admin/src/components/payments/ProviderConfig.tsx
'use client';

import { useState } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';
import { apiPatch } from '@/lib/api';
import type { PaymentProvider } from '@/types/admin.types';

const CONFIG_FIELDS: Record<string, Array<{ key: string; label: string; secret?: boolean }>> = {
  mpesa: [
    { key: 'consumerKey',    label: 'Consumer Key',    secret: true },
    { key: 'consumerSecret', label: 'Consumer Secret', secret: true },
    { key: 'shortcode',      label: 'Shortcode' },
    { key: 'passkey',        label: 'Passkey',         secret: true },
    { key: 'env',            label: 'Environment (sandbox | production)' },
  ],
  paypal: [
    { key: 'clientId',     label: 'Client ID' },
    { key: 'clientSecret', label: 'Client Secret', secret: true },
    { key: 'mode',         label: 'Mode (sandbox | live)' },
  ],
  stripe: [
    { key: 'secretKey',       label: 'Secret Key',       secret: true },
    { key: 'publishableKey',  label: 'Publishable Key' },
    { key: 'webhookSecret',   label: 'Webhook Secret',   secret: true },
  ],
  revenuecat: [
    { key: 'webhookSecret', label: 'Webhook Secret', secret: true },
  ],
};

interface ProviderConfigProps {
  provider: PaymentProvider;
}

export function ProviderConfig({ provider }: ProviderConfigProps) {
  const fields = CONFIG_FIELDS[provider.slug] ?? [];
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, (provider.config?.[f.key] as string) ?? '']))
  );
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!fields.length) {
    return (
      <div className="px-5 py-4 text-sm text-zinc-500">
        No configurable fields for this provider.
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/payments/providers/${provider.id}`, { config: values });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-5 pb-5 space-y-3">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-xs text-zinc-500 mb-1.5">{f.label}</label>
          <div className="relative">
            <input
              type={f.secret && !shown[f.key] ? 'password' : 'text'}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.secret ? '••••••••' : ''}
              className="w-full bg-[#0E0E0E] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#D4A843]/50 pr-10"
            />
            {f.secret && (
              <button
                type="button"
                onClick={() => setShown((s) => ({ ...s, [f.key]: !s[f.key] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {shown[f.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      ))}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A843] hover:bg-[#E8C060] text-black text-sm font-semibold transition-colors disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Config'}
      </button>
    </div>
  );
}
