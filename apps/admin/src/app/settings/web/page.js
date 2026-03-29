"use strict";
// apps/admin/src/app/settings/web/page.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WebSettingsPage;
const react_1 = require("react");
const API = process.env.NEXT_PUBLIC_API_URL;
function useAdminToken() {
    if (typeof window === 'undefined')
        return '';
    return localStorage.getItem('culicars_admin_token') ?? '';
}
function WebSettingsPage() {
    const token = useAdminToken();
    const [headline, setHeadline] = (0, react_1.useState)('');
    const [subtext, setSubtext] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [saved, setSaved] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (!token)
            return;
        fetch(`${API}/admin/config/web_hero`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => {
            setHeadline(d.value?.headline ?? '');
            setSubtext(d.value?.subtext ?? '');
            setLoading(false);
        });
    }, [token]);
    const handleSave = async () => {
        setSaving(true);
        await fetch(`${API}/admin/config/web_hero`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value: { headline, subtext } }),
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };
    if (loading) {
        return <div className="p-8 text-gray-400 text-sm">Loading…</div>;
    }
    return (<div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Web Config</h1>
      <p className="text-gray-400 text-sm mb-8">
        Controls the hero section on culicars.com homepage.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Hero Headline
          </label>
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"/>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Hero Subtext
          </label>
          <textarea value={subtext} onChange={(e) => setSubtext(e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"/>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Preview</p>
          <p className="font-semibold text-white">
            {headline || 'Headline goes here'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {subtext || 'Subtext goes here'}
          </p>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white font-medium transition-colors">
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
      </button>
    </div>);
}
