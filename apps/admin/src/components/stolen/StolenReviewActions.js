"use strict";
// apps/admin/src/components/stolen/StolenReviewActions.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StolenReviewActions = StolenReviewActions;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const api_1 = require("@/lib/api");
function StolenReviewActions({ reportId, currentStatus, onUpdate, }) {
    const [note, setNote] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    async function review(status) {
        setLoading(status);
        setError(null);
        try {
            await (0, api_1.apiPatch)(`/stolen-reports/${reportId}/review`, {
                status,
                adminNote: note,
            });
            onUpdate?.(status, note);
        }
        catch (e) {
            setError(e.message ?? 'Failed');
        }
        finally {
            setLoading(null);
        }
    }
    const isDone = ['active', 'rejected', 'duplicate', 'recovered'].includes(currentStatus);
    return (<div className="rounded-xl border border-white/8 bg-[#141414] p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-1">Review Decision</h3>
      <p className="text-xs text-zinc-500 mb-4">
        Approving adds a STOLEN vehicle_event and updates risk score to CRITICAL.
      </p>

      <div className="mb-4">
        <label className="block text-xs text-zinc-500 mb-2">Admin Note (optional)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} disabled={isDone} rows={3} placeholder="e.g. OB number verified, plate format correct…" className="w-full bg-[#0E0E0E] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-[#D4A843]/50 disabled:opacity-40"/>
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      <div className="flex flex-col gap-2">
        <button onClick={() => review('active')} disabled={isDone || loading !== null} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <lucide_react_1.CheckCircle className="w-4 h-4"/>
          {loading === 'active' ? 'Approving…' : 'Approve — Mark Stolen'}
        </button>
        <button onClick={() => review('rejected')} disabled={isDone || loading !== null} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <lucide_react_1.XCircle className="w-4 h-4"/>
          {loading === 'rejected' ? 'Rejecting…' : 'Reject'}
        </button>
        <button onClick={() => review('duplicate')} disabled={isDone || loading !== null} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Mark Duplicate
        </button>
      </div>

      {isDone && (<p className="text-xs text-zinc-500 mt-3 text-center">
          Already <span className="capitalize font-medium">{currentStatus}</span>. Cannot re-review.
        </p>)}
    </div>);
}
