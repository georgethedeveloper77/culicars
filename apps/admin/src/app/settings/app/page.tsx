// apps/admin/src/app/settings/app/page.tsx
'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL;

function useAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('culicars_admin_token') ?? '';
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
      <span className="text-sm text-gray-200">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          value ? 'bg-green-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export default function AppSettingsPage() {
  const token = useAdminToken();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [watchEnabled, setWatchEnabled] = useState(true);
  const [contribEnabled, setContribEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/admin/config/app_config`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const v = d.value;
        setTitle(v?.onboarding_title ?? '');
        setSubtitle(v?.onboarding_subtitle ?? '');
        setWatchEnabled(v?.feature_flags?.watch_enabled ?? true);
        setContribEnabled(v?.feature_flags?.contributions_enabled ?? false);
        setLoading(false);
      });
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`${API}/admin/config/app_config`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: {
          onboarding_title: title,
          onboarding_subtitle: subtitle,
          feature_flags: {
            watch_enabled: watchEnabled,
            contributions_enabled: contribEnabled,
          },
        },
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return <div className="p-8 text-gray-400 text-sm">Loading…</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">App Config</h1>
      <p className="text-gray-400 text-sm mb-8">
        Onboarding copy and feature flags for the iOS and Android app.
      </p>

      <div className="space-y-5 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Onboarding Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Onboarding Subtitle
          </label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <h2 className="font-semibold mb-1 text-gray-200">Feature Flags</h2>
      <p className="text-xs text-gray-500 mb-3">
        Disabled features are hidden from the app UI entirely.
      </p>
      <div className="bg-gray-800 rounded-lg px-4 mb-8">
        <Toggle
          label="Watch Tab Enabled"
          value={watchEnabled}
          onChange={setWatchEnabled}
        />
        <Toggle
          label="Contributions Enabled"
          value={contribEnabled}
          onChange={setContribEnabled}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white font-medium transition-colors"
      >
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
      </button>
    </div>
  );
}
