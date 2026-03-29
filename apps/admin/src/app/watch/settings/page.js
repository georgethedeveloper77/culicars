"use strict";
// apps/admin/src/app/watch/settings/page.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WatchSettingsPage;
const react_1 = require("react");
const API = process.env.NEXT_PUBLIC_API_URL;
function useAdminToken() {
    if (typeof window === 'undefined')
        return '';
    return localStorage.getItem('culicars_admin_token') ?? '';
}
function Toggle({ label, description, value, onChange, }) {
    return (<div className="flex items-start justify-between py-4 border-b border-gray-700 last:border-0">
      <div>
        <p className="text-sm text-gray-200">{label}</p>
        {description && (<p className="text-xs text-gray-500 mt-0.5">{description}</p>)}
      </div>
      <button onClick={() => onChange(!value)} className={`relative ml-4 shrink-0 w-11 h-6 rounded-full transition-colors ${value ? 'bg-green-600' : 'bg-gray-600'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`}/>
      </button>
    </div>);
}
function WatchSettingsPage() {
    const token = useAdminToken();
    const [approvalMode, setApprovalMode] = (0, react_1.useState)('manual');
    const [expiryDays, setExpiryDays] = (0, react_1.useState)(90);
    const [publicVisibility, setPublicVisibility] = (0, react_1.useState)(true);
    const [requireEvidence, setRequireEvidence] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [saved, setSaved] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (!token)
            return;
        fetch(`${API}/admin/config/watch_settings`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => {
            const v = d.value;
            setApprovalMode(v?.approval_mode ?? 'manual');
            setExpiryDays(v?.expiry_days ?? 90);
            setPublicVisibility(v?.public_visibility ?? true);
            setRequireEvidence(v?.require_evidence ?? false);
            setLoading(false);
        });
    }, [token]);
    const handleSave = async () => {
        setSaving(true);
        await fetch(`${API}/admin/config/watch_settings`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                value: {
                    approval_mode: approvalMode,
                    expiry_days: expiryDays,
                    public_visibility: publicVisibility,
                    require_evidence: requireEvidence,
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
    return (<div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Watch Settings</h1>
      <p className="text-gray-400 text-sm mb-8">
        Controls how community alerts are handled and displayed.
      </p>

      <div className="space-y-6">
        {/* Approval mode */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Approval Mode
          </label>
          <div className="flex gap-3">
            {['manual', 'auto'].map((mode) => (<button key={mode} onClick={() => setApprovalMode(mode)} className={`px-5 py-2 rounded-lg border text-sm font-medium transition-colors ${approvalMode === mode
                ? 'bg-blue-700 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'}`}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Manual requires admin approval before alerts go public. Auto
            publishes immediately.
          </p>
        </div>

        {/* Expiry */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Alert Expiry (days)
          </label>
          <input type="number" value={expiryDays} onChange={(e) => setExpiryDays(Number(e.target.value))} min={1} max={365} className="w-28 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"/>
          <p className="text-xs text-gray-500 mt-2">
            Approved alerts expire and are removed from the public feed after
            this many days.
          </p>
        </div>

        {/* Toggles */}
        <div className="bg-gray-800 rounded-lg px-4">
          <Toggle label="Public Visibility" description="Approved alerts appear on the public Watch feed and map" value={publicVisibility} onChange={setPublicVisibility}/>
          <Toggle label="Require Evidence on Submission" description="Users must attach a photo or file when submitting an alert" value={requireEvidence} onChange={setRequireEvidence}/>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="mt-8 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-white font-medium transition-colors">
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
      </button>
    </div>);
}
