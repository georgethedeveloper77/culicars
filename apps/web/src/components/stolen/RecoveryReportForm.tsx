'use client';
// apps/web/src/components/stolen/RecoveryReportForm.tsx

import { useState, FormEvent } from 'react';
import { markRecovered } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { KENYA_COUNTIES } from '@/lib/constants';

interface RecoveryReportFormProps {
  reportId: string;
  plate: string;
  onSuccess: () => void;
}

export function RecoveryReportForm({ reportId, plate, onSuccess }: RecoveryReportFormProps) {
  const { token } = useAuth();
  const [form, setForm] = useState({ recoveryDate: '', recoveryCounty: '', recoveryNotes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.recoveryDate || !form.recoveryCounty) {
      setError('Recovery date and county are required.');
      return;
    }
    if (!token) {
      setError('You must be signed in to submit a recovery report.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await markRecovered(reportId, form, token);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-950/30 border border-red-600/40 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}

      <p className="text-cc-muted text-sm">
        Marking <span className="font-mono font-semibold text-cc-text">{plate}</span> as recovered
        will update the stolen report and notify the community.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="cc-label">Date recovered <span className="text-red-400">*</span></label>
          <input
            type="date"
            className="cc-input"
            value={form.recoveryDate}
            onChange={e => setForm(f => ({ ...f, recoveryDate: e.target.value }))}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        <div>
          <label className="cc-label">County found <span className="text-red-400">*</span></label>
          <select
            className="cc-input"
            value={form.recoveryCounty}
            onChange={e => setForm(f => ({ ...f, recoveryCounty: e.target.value }))}
            required
          >
            <option value="">Select county…</option>
            {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="cc-label">Notes (optional)</label>
        <textarea
          className="cc-input resize-none"
          rows={3}
          value={form.recoveryNotes}
          onChange={e => setForm(f => ({ ...f, recoveryNotes: e.target.value }))}
          placeholder="How was it recovered? e.g. Police found it, self-recovery, informant…"
        />
      </div>

      <button type="submit" disabled={loading} className="cc-btn-primary w-full">
        {loading ? 'Submitting…' : '✓ Mark as Recovered'}
      </button>
    </form>
  );
}
