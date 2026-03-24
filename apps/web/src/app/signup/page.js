"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SignupPage;
// apps/web/src/app/signup/page.tsx
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const auth_context_1 = require("@/lib/auth-context");
function SignupForm() {
    const { signUp } = (0, auth_context_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const pack = searchParams.get('pack');
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [confirm, setConfirm] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [done, setDone] = (0, react_1.useState)(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        setLoading(true);
        setError(null);
        const { error } = await signUp(email, password);
        if (error) {
            setError(error.message || 'Could not create account');
            setLoading(false);
        }
        else {
            setDone(true);
        }
    };
    if (done) {
        return (<div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="cc-card p-8">
            <span className="text-4xl block mb-3">📧</span>
            <h2 className="text-xl font-bold text-cc-text mb-2">Check your email</h2>
            <p className="text-cc-muted text-sm mb-4">
              We've sent a confirmation link to <span className="text-cc-text font-medium">{email}</span>.
              Click it to activate your account.
            </p>
            <link_1.default href="/login" className="cc-btn-secondary w-full">Back to sign in</link_1.default>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <link_1.default href="/" className="inline-flex items-center gap-2">
            <span className="text-cc-accent font-mono text-3xl font-bold">⬡</span>
            <span className="font-semibold text-xl text-cc-text">Culi<span className="text-cc-accent">Cars</span></span>
          </link_1.default>
          <p className="text-cc-muted text-sm mt-3">
            {pack ? 'Create an account to buy credits' : 'Create your free account'}
          </p>
        </div>

        <div className="cc-card p-7">
          {error && (<div className="mb-5 bg-red-950/30 border border-red-600/40 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>)}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="cc-label">Email</label>
              <input type="email" className="cc-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus autoComplete="email"/>
            </div>
            <div>
              <label className="cc-label">Password</label>
              <input type="password" className="cc-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required autoComplete="new-password"/>
            </div>
            <div>
              <label className="cc-label">Confirm password</label>
              <input type="password" className="cc-input" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required autoComplete="new-password"/>
            </div>

            <button type="submit" disabled={loading} className="cc-btn-primary w-full py-3 mt-2">
              {loading ? (<span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Creating account…
                </span>) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-cc-muted text-sm mt-5">
            Already have an account?{' '}
            <link_1.default href="/login" className="text-cc-accent hover:text-cc-accent-dim transition-colors font-medium">
              Sign in
            </link_1.default>
          </p>
        </div>
      </div>
    </div>);
}
function SignupPage() {
    return (<react_1.Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-cc-border border-t-cc-accent animate-spin"/></div>}>
      <SignupForm />
    </react_1.Suspense>);
}
