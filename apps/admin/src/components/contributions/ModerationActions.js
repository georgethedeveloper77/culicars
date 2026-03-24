"use strict";
// apps/admin/src/components/contributions/ModerationActions.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationActions = ModerationActions;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const api_1 = require("@/lib/api");
function ModerationActions({ contributionId, currentStatus, onUpdate, }) {
    const [note, setNote] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    async function moderate(status) {
        setLoading(status);
        setError(null);
        try {
            await (0, api_1.apiPatch)(`/contributions/${contributionId}/moderate`, {
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
    const isDone = ['approved', 'rejected', 'flagged'].includes(currentStatus);
    return (<div className="rounded-xl border border-white/8 bg-[#141414] p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">Moderation</h3>

      <div className="mb-4">
        <label className="block text-xs text-zinc-500 mb-2">Admin Note (optional)</label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} disabled={isDone} rows={3} placeholder="Add a note for audit trail..." className="w-full bg-[#0E0E0E] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-[#D4A843]/50 disabled:opacity-40"/>
      </div>

      {error && (<p className="text-xs text-red-400 mb-3">{error}</p>)}

      <div className="flex gap-2">
        <button onClick={() => moderate('approved')} disabled={isDone || loading !== null} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <lucide_react_1.CheckCircle className="w-4 h-4"/>
          {loading === 'approved' ? 'Approving…' : 'Approve'}
        </button>
        <button onClick={() => moderate('rejected')} disabled={isDone || loading !== null} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <lucide_react_1.XCircle className="w-4 h-4"/>
          {loading === 'rejected' ? 'Rejecting…' : 'Reject'}
        </button>
        <button onClick={() => moderate('flagged')} disabled={isDone || loading !== null} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <lucide_react_1.Flag className="w-4 h-4"/>
          {loading === 'flagged' ? 'Flagging…' : 'Flag'}
        </button>
      </div>

      {isDone && (<p className="text-xs text-zinc-500 mt-3">
          Already {currentStatus}. Cannot moderate again.
        </p>)}
    </div>);
}
