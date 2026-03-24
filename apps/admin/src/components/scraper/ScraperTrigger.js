"use strict";
// apps/admin/src/components/scraper/ScraperTrigger.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperTrigger = ScraperTrigger;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const api_1 = require("@/lib/api");
const SOURCES = [
    'JIJI', 'PIGIAME', 'OLX', 'AUTOCHEK', 'AUTOSKENYA',
    'KABA', 'AUTO_EXPRESS', 'KRA_IBID', 'GARAM', 'MOGO',
    'CAR_DUKA', 'BEFORWARD',
];
function ScraperTrigger({ onJobCreated }) {
    const [source, setSource] = (0, react_1.useState)(SOURCES[0]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [result, setResult] = (0, react_1.useState)(null);
    async function trigger() {
        setLoading(true);
        setResult(null);
        try {
            const job = await (0, api_1.apiPost)('/admin/scraper/run', { source });
            setResult({ ok: true, message: `Job created — ID: ${job.id.slice(0, 8)}…` });
            onJobCreated?.(job);
        }
        catch (e) {
            setResult({ ok: false, message: e.message ?? 'Failed to trigger' });
        }
        finally {
            setLoading(false);
        }
    }
    return (<div className="rounded-xl border border-white/8 bg-[#141414] p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">Manual Trigger</h3>
      <div className="flex gap-3">
        <select value={source} onChange={(e) => setSource(e.target.value)} className="flex-1 bg-[#0E0E0E] border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#D4A843]/50">
          {SOURCES.map((s) => (<option key={s} value={s}>{s.replace(/_/g, ' ')}</option>))}
        </select>
        <button onClick={trigger} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4A843] hover:bg-[#E8C060] text-black text-sm font-semibold transition-colors disabled:opacity-50">
          {loading ? <lucide_react_1.Loader2 className="w-4 h-4 animate-spin"/> : <lucide_react_1.Play className="w-4 h-4"/>}
          {loading ? 'Triggering…' : 'Run'}
        </button>
      </div>
      {result && (<p className={`mt-3 text-xs ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {result.message}
        </p>)}
    </div>);
}
