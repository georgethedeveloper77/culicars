"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NtsaFetchSection = NtsaFetchSection;
// apps/web/src/components/report/NtsaFetchSection.tsx
const react_1 = require("react");
const auth_context_1 = require("@/lib/auth-context");
const api_1 = require("@/lib/api");
function NtsaFetchSection({ vin, plate, ntsaVerified, onConsented }) {
    const { user, token } = (0, auth_context_1.useAuth)();
    const [consented, setConsented] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [step, setStep] = (0, react_1.useState)('idle');
    const handleConsent = async () => {
        if (!token)
            return;
        setLoading(true);
        try {
            await (0, api_1.recordNtsaConsent)({ vin, plate }, token);
            setConsented(true);
            setStep('consented');
            onConsented?.();
        }
        catch {
            // consent recorded client-side if API fails
            setConsented(true);
            setStep('consented');
        }
        finally {
            setLoading(false);
        }
    };
    const handleOpenEcitizen = () => {
        window.open('https://ntsa.ecitizen.go.ke', '_blank', 'noopener,noreferrer');
        setStep('opened');
    };
    if (ntsaVerified) {
        return (<div className="p-6">
        <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <span className="text-2xl">🏛️</span>
          <div>
            <p className="font-semibold text-blue-400">NTSA Data Verified</p>
            <p className="text-sm text-cc-muted mt-0.5">
              Official NTSA Certificate of Registration data has been fetched and verified for this vehicle.
            </p>
          </div>
        </div>
      </div>);
    }
    return (<div className="p-6">
      <div className="cc-card-2 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🏛️</span>
          <div>
            <p className="font-semibold text-cc-text">Get Official NTSA Record</p>
            <p className="text-sm text-cc-muted mt-1">
              Fetch the official Certificate of Registration (COR) from NTSA eCitizen.
              This costs <span className="font-semibold text-cc-text">KSh 550</span> paid directly to NTSA — not to CuliCars.
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs">
          {['Consent', 'Open eCitizen', 'Auto-fetch PDF'].map((s, i) => (<div key={s} className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${(i === 0 && step !== 'idle') || (i === 1 && step === 'opened') || (i === 2 && step === 'opened')
                ? 'bg-cc-accent text-cc-bg'
                : 'bg-cc-surface border border-cc-border text-cc-faint'}`}>
                {i + 1}
              </span>
              <span className="text-cc-muted">{s}</span>
              {i < 2 && <span className="text-cc-faint">→</span>}
            </div>))}
        </div>

        {/* Privacy note */}
        <div className="bg-cc-surface rounded-lg p-3 text-xs text-cc-muted border border-cc-border">
          🔒 <strong>Privacy:</strong> CuliCars discards owner name, ID, and address from the NTSA PDF.
          Only vehicle data (plate, VIN, inspection status, caveat) is stored.
        </div>

        {/* CTAs */}
        {!user ? (<p className="text-sm text-cc-muted">Sign in to fetch NTSA data for this vehicle.</p>) : step === 'idle' ? (<button onClick={handleConsent} disabled={loading} className="cc-btn-primary w-full">
            {loading ? 'Recording consent…' : 'I consent — proceed to NTSA eCitizen (KSh 550)'}
          </button>) : step === 'consented' ? (<div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <span>✓</span>
              <span>Consent recorded. Click below to open NTSA eCitizen.</span>
            </div>
            <button onClick={handleOpenEcitizen} className="cc-btn-primary w-full">
              Open NTSA eCitizen →
            </button>
          </div>) : (<div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span>Waiting for NTSA PDF… Complete payment on eCitizen, then return here.</span>
            </div>
            <p className="text-xs text-cc-faint">
              The PDF is intercepted automatically — there is no upload button required.
            </p>
            <button onClick={handleOpenEcitizen} className="cc-btn-secondary w-full text-sm">
              Reopen eCitizen
            </button>
          </div>)}
      </div>
    </div>);
}
