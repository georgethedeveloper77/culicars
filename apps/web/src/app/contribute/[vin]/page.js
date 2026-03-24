"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ContributeVinPage;
// apps/web/src/app/contribute/[vin]/page.tsx
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const api_1 = require("@/lib/api");
const auth_context_1 = require("@/lib/auth-context");
const CONTRIBUTION_TYPES = [
    { value: 'MILEAGE_RECORD', label: 'Mileage Record', icon: '📏' },
    { value: 'DAMAGE_REPORT', label: 'Damage Report', icon: '💥' },
    { value: 'SERVICE_RECORD', label: 'Service Record', icon: '🔧' },
    { value: 'OWNERSHIP_TRANSFER', label: 'Ownership Transfer', icon: '👤' },
    { value: 'PHOTO_EVIDENCE', label: 'Photo Evidence', icon: '📷' },
    { value: 'GENERAL_NOTE', label: 'General Note', icon: '📋' },
];
function ContributeVinPage() {
    const { vin } = (0, navigation_1.useParams)();
    const { token } = (0, auth_context_1.useAuth)();
    const [type, setType] = (0, react_1.useState)('');
    const [title, setTitle] = (0, react_1.useState)('');
    const [description, setDescription] = (0, react_1.useState)('');
    const [mileage, setMileage] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [success, setSuccess] = (0, react_1.useState)(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!type || !title) {
            setError('Please select a type and add a title.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await (0, api_1.submitContribution)({
                vin: vin,
                type,
                title,
                description,
                data: mileage ? { mileage: parseInt(mileage) } : undefined,
            }, token || undefined);
            setSuccess(true);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Submission failed');
        }
        finally {
            setLoading(false);
        }
    };
    if (success) {
        return (<div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="cc-card p-8">
          <span className="text-4xl block mb-3">✓</span>
          <h2 className="text-xl font-bold text-cc-text mb-2">Contribution Submitted</h2>
          <p className="text-cc-muted text-sm mb-6">
            Thank you! Our team will review your contribution. Approved data improves this vehicle's report for all future buyers.
          </p>
          <link_1.default href={`/search?q=${vin}`} className="cc-btn-secondary w-full">
            View vehicle report →
          </link_1.default>
        </div>
      </div>);
    }
    return (<div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cc-text mb-1">Contribute Data</h1>
        <p className="text-cc-muted text-sm">
          Vehicle VIN: <span className="font-mono font-semibold text-cc-text">{vin}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (<div className="bg-red-950/30 border border-red-600/40 rounded-xl p-3 text-red-400 text-sm">{error}</div>)}

        {/* Contribution type */}
        <div className="cc-card p-5">
          <label className="cc-label mb-3 block">Contribution type <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CONTRIBUTION_TYPES.map(ct => (<button key={ct.value} type="button" onClick={() => setType(ct.value)} className={`py-3 px-3 rounded-xl border text-sm font-medium transition-colors flex flex-col items-center gap-1.5 ${type === ct.value
                ? 'border-cc-accent bg-cc-accent/10 text-cc-accent'
                : 'border-cc-border bg-cc-surface-2 text-cc-muted hover:border-cc-border-2'}`}>
                <span className="text-xl">{ct.icon}</span>
                <span className="text-xs">{ct.label}</span>
              </button>))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="cc-label">Title <span className="text-red-400">*</span></label>
          <input className="cc-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Oil change at Toyota Kenya — 85,000 km" required/>
        </div>

        {/* Mileage if relevant */}
        {(type === 'MILEAGE_RECORD' || type === 'SERVICE_RECORD') && (<div>
            <label className="cc-label">Mileage (km)</label>
            <input className="cc-input font-mono" type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="85000" min="0"/>
          </div>)}

        {/* Description */}
        <div>
          <label className="cc-label">Description</label>
          <textarea className="cc-input resize-none" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide as much detail as possible…"/>
        </div>

        <div className="bg-cc-surface-2 border border-cc-border rounded-xl p-4 text-xs text-cc-muted">
          All contributions are reviewed by our admin team before being added to the vehicle report.
          Confidence score: up to 0.65 (capped below NTSA trust level).
        </div>

        <button type="submit" disabled={loading} className="cc-btn-primary w-full">
          {loading ? 'Submitting…' : 'Submit Contribution'}
        </button>
      </form>
    </div>);
}
