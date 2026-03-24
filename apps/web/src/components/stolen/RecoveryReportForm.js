"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryReportForm = RecoveryReportForm;
// apps/web/src/components/stolen/RecoveryReportForm.tsx
const react_1 = require("react");
const api_1 = require("@/lib/api");
const auth_context_1 = require("@/lib/auth-context");
const constants_1 = require("@/lib/constants");
function RecoveryReportForm({ reportId, plate, onSuccess }) {
    const { token } = (0, auth_context_1.useAuth)();
    const [form, setForm] = (0, react_1.useState)({ recoveryDate: '', recoveryCounty: '', recoveryNotes: '' });
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const handleSubmit = async (e) => {
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
            await (0, api_1.markRecovered)(reportId, form, token);
            onSuccess();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Submission failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
      {error && (<div className="bg-red-950/30 border border-red-600/40 rounded-xl p-3 text-red-400 text-sm">{error}</div>)}

      <p className="text-cc-muted text-sm">
        Marking <span className="font-mono font-semibold text-cc-text">{plate}</span> as recovered
        will update the stolen report and notify the community.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="cc-label">Date recovered <span className="text-red-400">*</span></label>
          <input type="date" className="cc-input" value={form.recoveryDate} onChange={e => setForm(f => ({ ...f, recoveryDate: e.target.value }))} max={new Date().toISOString().split('T')[0]} required/>
        </div>
        <div>
          <label className="cc-label">County found <span className="text-red-400">*</span></label>
          <select className="cc-input" value={form.recoveryCounty} onChange={e => setForm(f => ({ ...f, recoveryCounty: e.target.value }))} required>
            <option value="">Select county…</option>
            {constants_1.KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="cc-label">Notes (optional)</label>
        <textarea className="cc-input resize-none" rows={3} value={form.recoveryNotes} onChange={e => setForm(f => ({ ...f, recoveryNotes: e.target.value }))} placeholder="How was it recovered? e.g. Police found it, self-recovery, informant…"/>
      </div>

      <button type="submit" disabled={loading} className="cc-btn-primary w-full">
        {loading ? 'Submitting…' : '✓ Mark as Recovered'}
      </button>
    </form>);
}
