// apps/admin/src/components/contributions/ModerationActions.tsx
'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Flag } from 'lucide-react';
import { apiPatch } from '@/lib/api';
import type { ContribStatus } from '@/types/admin.types';

interface ModerationActionsProps {
  contributionId: string;
  currentStatus: ContribStatus;
  onUpdate?: (newStatus: ContribStatus, note: string) => void;
}

export function ModerationActions({
  contributionId,
  currentStatus,
  onUpdate,
}: ModerationActionsProps) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function moderate(status: ContribStatus) {
    setLoading(status);
    setError(null);
    try {
      await apiPatch(`/contributions/${contributionId}/moderate`, {
        status,
        adminNote: note,
      });
      onUpdate?.(status, note);
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed');
    } finally {
      setLoading(null);
    }
  }

  const isDone = ['approved', 'rejected', 'flagged'].includes(currentStatus);

  return (
    <div className="rounded-xl border border-white/8 bg-[#141414] p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">Moderation</h3>

      <div className="mb-4">
        <label className="block text-xs text-zinc-500 mb-2">Admin Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isDone}
          rows={3}
          placeholder="Add a note for audit trail..."
          className="w-full bg-[#0E0E0E] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-[#D4A843]/50 disabled:opacity-40"
        />
      </div>

      {error && (
        <p className="text-xs text-red-400 mb-3">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => moderate('approved')}
          disabled={isDone || loading !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-4 h-4" />
          {loading === 'approved' ? 'Approving…' : 'Approve'}
        </button>
        <button
          onClick={() => moderate('rejected')}
          disabled={isDone || loading !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <XCircle className="w-4 h-4" />
          {loading === 'rejected' ? 'Rejecting…' : 'Reject'}
        </button>
        <button
          onClick={() => moderate('flagged')}
          disabled={isDone || loading !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Flag className="w-4 h-4" />
          {loading === 'flagged' ? 'Flagging…' : 'Flag'}
        </button>
      </div>

      {isDone && (
        <p className="text-xs text-zinc-500 mt-3">
          Already {currentStatus}. Cannot moderate again.
        </p>
      )}
    </div>
  );
}
