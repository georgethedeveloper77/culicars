"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockedOverlay = LockedOverlay;
exports.UnlockCTA = UnlockCTA;
// apps/web/src/components/report/LockedOverlay.tsx
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const auth_context_1 = require("@/lib/auth-context");
const api_1 = require("@/lib/api");
function LockedOverlay({ reportId, onUnlocked }) {
    return (<div className="relative">
      {/* Blurred preview content */}
      <div className="pointer-events-none select-none filter blur-sm opacity-40 px-6 py-4">
        {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-4 bg-cc-muted/20 rounded mb-2" style={{ width: `${70 + Math.random() * 30}%` }}/>))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="cc-card p-6 text-center max-w-xs mx-4 shadow-2xl border-cc-accent/20">
          <div className="text-3xl mb-3">🔒</div>
          <h4 className="font-semibold text-cc-text mb-1">Section Locked</h4>
          <p className="text-cc-muted text-xs mb-4">
            Unlock the full report with 1 credit to see this section and all others.
          </p>
          <UnlockCTA reportId={reportId} onUnlocked={onUnlocked}/>
          <p className="text-cc-faint text-xs mt-3">1 credit · KSh 150</p>
        </div>
      </div>
    </div>);
}
function UnlockCTA({ reportId, onUnlocked, className }) {
    const { user, token } = (0, auth_context_1.useAuth)();
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const handleUnlock = async () => {
        if (!token)
            return;
        setLoading(true);
        setError(null);
        try {
            await (0, api_1.unlockReport)(reportId, token);
            onUnlocked?.();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to unlock';
            setError(message);
        }
        finally {
            setLoading(false);
        }
    };
    if (!user) {
        return (<link_1.default href={`/login?next=/report/${reportId}`} className={`cc-btn-primary w-full ${className}`}>
        Sign in to unlock
      </link_1.default>);
    }
    return (<div className={className}>
      <button onClick={handleUnlock} disabled={loading} className="cc-btn-primary w-full">
        {loading ? (<span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Unlocking…
          </span>) : 'Unlock Full Report (1 credit)'}
      </button>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>);
}
