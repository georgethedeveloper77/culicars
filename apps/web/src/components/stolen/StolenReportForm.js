"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StolenReportForm = StolenReportForm;
// apps/web/src/components/stolen/StolenReportForm.tsx
const react_1 = require("react");
const api_1 = require("@/lib/api");
const constants_1 = require("@/lib/constants");
function StolenReportForm({ defaultPlate = '', onSuccess }) {
    const [form, setForm] = (0, react_1.useState)({
        plate: defaultPlate.toUpperCase(),
        reporterType: 'owner',
        countyStolen: '',
    });
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.plate || !form.dateStolenIso || !form.countyStolen || !form.townStolen || !form.carColor || !form.reporterType) {
            setError('Please fill in all required fields.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await (0, api_1.submitStolenReport)(form);
            onSuccess(result.id);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Submission failed');
        }
        finally {
            setLoading(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-6">
      {error && (<div className="bg-red-950/30 border border-red-600/40 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>)}

      {/* Vehicle details */}
      <div className="cc-card p-6 space-y-4">
        <h3 className="font-semibold text-cc-text">Vehicle Details</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="cc-label">Plate number <span className="text-red-400">*</span></label>
            <input className="cc-input font-mono tracking-widest uppercase" value={form.plate || ''} onChange={e => update('plate', e.target.value.toUpperCase())} placeholder="KCA 123A" required/>
          </div>
          <div>
            <label className="cc-label">VIN (optional)</label>
            <input className="cc-input font-mono" value={form.vin || ''} onChange={e => update('vin', e.target.value.toUpperCase())} placeholder="17-character VIN" maxLength={17}/>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="cc-label">Car color <span className="text-red-400">*</span></label>
            <input className="cc-input" value={form.carColor || ''} onChange={e => update('carColor', e.target.value)} placeholder="e.g. Silver, White, Blue" required/>
          </div>
          <div>
            <label className="cc-label">Identifying marks</label>
            <input className="cc-input" value={form.identifyingMarks || ''} onChange={e => update('identifyingMarks', e.target.value)} placeholder="Stickers, damage, custom parts…"/>
          </div>
        </div>
      </div>

      {/* Theft details */}
      <div className="cc-card p-6 space-y-4">
        <h3 className="font-semibold text-cc-text">Theft Details</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="cc-label">Date stolen <span className="text-red-400">*</span></label>
            <input type="date" className="cc-input" value={form.dateStolenIso || ''} onChange={e => update('dateStolenIso', e.target.value)} max={new Date().toISOString().split('T')[0]} required/>
          </div>
          <div>
            <label className="cc-label">County <span className="text-red-400">*</span></label>
            <select className="cc-input" value={form.countyStolen || ''} onChange={e => update('countyStolen', e.target.value)} required>
              <option value="">Select county…</option>
              {constants_1.KENYA_COUNTIES.map(c => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
        </div>

        <div>
          <label className="cc-label">Town / area <span className="text-red-400">*</span></label>
          <input className="cc-input" value={form.townStolen || ''} onChange={e => update('townStolen', e.target.value)} placeholder="e.g. Westlands, Mombasa CBD, Industrial Area" required/>
        </div>
      </div>

      {/* Police details */}
      <div className="cc-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div>
            <h3 className="font-semibold text-cc-text">Police Report</h3>
            <p className="text-cc-muted text-xs mt-0.5">Optional but strongly recommended. An OB number marks your report as verified.</p>
          </div>
          <span className="cc-pill bg-blue-500/10 text-blue-400 text-xs shrink-0">Boosts credibility</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="cc-label">Police OB number</label>
            <input className="cc-input font-mono" value={form.policeObNumber || ''} onChange={e => update('policeObNumber', e.target.value)} placeholder="OB/1234/2024"/>
          </div>
          <div>
            <label className="cc-label">Police station</label>
            <input className="cc-input" value={form.policeStation || ''} onChange={e => update('policeStation', e.target.value)} placeholder="e.g. Parklands Police Station"/>
          </div>
        </div>
      </div>

      {/* Reporter + contact */}
      <div className="cc-card p-6 space-y-4">
        <h3 className="font-semibold text-cc-text">Reporter &amp; Contact</h3>
        <p className="text-cc-muted text-xs">Contact is optional. It allows police or a finder to reach you.</p>

        <div>
          <label className="cc-label">You are <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['owner', 'family', 'witness', 'police'].map(type => (<button key={type} type="button" onClick={() => update('reporterType', type)} className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors capitalize ${form.reporterType === type
                ? 'border-cc-accent bg-cc-accent/10 text-cc-accent'
                : 'border-cc-border bg-cc-surface-2 text-cc-muted hover:border-cc-border-2'}`}>
                {type === 'family' ? 'Family member' : type === 'police' ? 'Police officer' : type}
              </button>))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="cc-label">Phone number</label>
            <input className="cc-input" value={form.contactPhone || ''} onChange={e => update('contactPhone', e.target.value)} placeholder="+254 7XX XXX XXX" type="tel"/>
          </div>
          <div>
            <label className="cc-label">Email</label>
            <input className="cc-input" value={form.contactEmail || ''} onChange={e => update('contactEmail', e.target.value)} placeholder="your@email.com" type="email"/>
          </div>
        </div>
      </div>

      {/* Privacy note */}
      <div className="bg-cc-surface-2 border border-cc-border rounded-xl p-4 text-xs text-cc-muted">
        🔒 Your contact information is never shown publicly. It is only shared with Kenya Police or a vehicle finder upon request.
        All reports are reviewed by our admin team before being published.
      </div>

      <button type="submit" disabled={loading} className="cc-btn-danger w-full py-4 text-base">
        {loading ? (<span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Submitting report…
          </span>) : '🚨 Submit Stolen Vehicle Report'}
      </button>
    </form>);
}
