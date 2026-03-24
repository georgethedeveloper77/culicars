// apps/admin/src/app/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';

interface AdminSetting {
  key: string;
  value: unknown;
  description?: string;
}

const SETTING_DESCRIPTIONS: Record<string, string> = {
  'report.free_sections':         'Comma-separated section types that are always free',
  'report.credits_required':      'Credits required to unlock a full report (default: 1)',
  'search.max_results':           'Maximum search candidates returned per query',
  'scraper.concurrency':          'Number of concurrent scraper requests',
  'scraper.delay_ms':             'Delay between scraper requests (ms)',
  'stolen.ob_required_for_verify': 'Require OB number for is_ob_verified flag',
  'ocr.min_confidence':           'Minimum OCR confidence threshold (0.0 – 1.0)',
  'contribution.max_confidence':  'Maximum confidence cap for user contributions',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    apiGet<AdminSetting[]>('/admin/settings')
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function getValue(s: AdminSetting) {
    return edited[s.key] ?? JSON.stringify(s.value);
  }

  async function saveSetting(s: AdminSetting) {
    setSaving(s.key);
    try {
      let parsed: unknown;
      try { parsed = JSON.parse(getValue(s)); } catch { parsed = getValue(s); }
      await apiPost(`/admin/settings`, { key: s.key, value: parsed });
      setSettings((prev) =>
        prev.map((p) => (p.key === s.key ? { ...p, value: parsed } : p))
      );
      setSaved(s.key);
      setTimeout(() => setSaved(null), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-white/4 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin Settings"
        description="Platform-wide configuration stored in admin_settings table"
      />

      <div className="space-y-3">
        {settings.map((s) => (
          <div key={s.key} className="rounded-xl border border-white/8 bg-[#141414] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono font-semibold text-[#D4A843]">{s.key}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {SETTING_DESCRIPTIONS[s.key] ?? s.description ?? 'No description'}
                </p>
                <div className="mt-3">
                  <input
                    value={getValue(s)}
                    onChange={(e) => setEdited((prev) => ({ ...prev, [s.key]: e.target.value }))}
                    className="w-full bg-[#0E0E0E] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-[#D4A843]/50"
                  />
                </div>
              </div>
              <button
                onClick={() => saveSetting(s)}
                disabled={saving === s.key}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/6 hover:bg-white/10 text-sm font-medium transition-colors border border-white/10 flex-shrink-0 mt-5 disabled:opacity-40"
              >
                {saving === s.key ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : saved === s.key ? (
                  <span className="text-emerald-400">Saved ✓</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        {settings.length === 0 && (
          <div className="rounded-xl border border-white/8 p-12 text-center">
            <p className="text-zinc-500 text-sm">No settings found in admin_settings table.</p>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 rounded-xl border border-white/6 bg-white/2 text-xs text-zinc-500">
        <strong className="text-zinc-400">Note:</strong> Settings are stored in the <code className="font-mono text-zinc-300">admin_settings</code> table.
        Values should be valid JSON. Changes take effect immediately without restart.
      </div>
    </div>
  );
}
