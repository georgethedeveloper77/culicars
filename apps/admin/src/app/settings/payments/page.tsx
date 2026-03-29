// apps/admin/src/app/settings/payments/page.tsx
'use client';

import { useEffect, useState } from 'react';

const ALL_WEB_PROVIDERS = ['mpesa', 'stripe', 'paypal', 'card'];
const ALL_APP_PROVIDERS = ['mpesa', 'apple_iap', 'play_billing'];
const API = process.env.NEXT_PUBLIC_API_URL;

async function fetchConfig(key: string, token: string): Promise<string[]> {
  const res = await fetch(`${API}/admin/config/${key}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.value as string[];
}

async function saveConfig(
  key: string,
  value: unknown,
  token: string,
): Promise<void> {
  await fetch(`${API}/admin/config/${key}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value }),
  });
}

function useAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('culicars_admin_token') ?? '';
}

function ProviderToggle({
  label,
  providers,
  enabled,
  onChange,
}: {
  label: string;
  providers: string[];
  enabled: string[];
  onChange: (p: string[]) => void;
}) {
  const toggle = (p: string) => {
    onChange(
      enabled.includes(p) ? enabled.filter((x) => x !== p) : [...enabled, p],
    );
  };

  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-3 text-gray-300">{label}</h3>
      <div className="flex flex-wrap gap-3">
        {providers.map((p) => (
          <button
            key={p}
            onClick={() => toggle(p)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              enabled.includes(p)
                ? 'bg-green-700 border-green-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PaymentsSettingsPage() {
  const token = useAdminToken();
  const [webProviders, setWebProviders] = useState<string[]>([]);
  const [appProviders, setAppProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetchConfig('payment_providers_web', token),
      fetchConfig('payment_providers_app', token),
    ]).then(([web, app]) => {
      setWebProviders(web);
      setAppProviders(app);
      setLoading(false);
    });
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      saveConfig('payment_providers_web', webProviders, token),
      saveConfig('payment_providers_app', appProviders, token),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="p-8 text-gray-400 text-sm">Loading…</div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Payments & Providers</h1>
      <p className="text-gray-400 text-sm mb-8">
        Toggling a provider removes it from the API immediately. No redeploy
        needed.
      </p>

      <ProviderToggle
        label="Web Providers (culicars.com)"
        providers={ALL_WEB_PROVIDERS}
        enabled={webProviders}
        onChange={setWebProviders}
      />

      <ProviderToggle
        label="App Providers (iOS / Android)"
        providers={ALL_APP_PROVIDERS}
        enabled={appProviders}
        onChange={setAppProviders}
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
      </button>
    </div>
  );
}
