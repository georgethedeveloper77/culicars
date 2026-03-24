'use client';
// apps/web/src/app/login/page.tsx

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message || 'Invalid email or password');
      setLoading(false);
    } else {
      router.push(next);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-cc-accent font-mono text-3xl font-bold">⬡</span>
            <span className="font-semibold text-xl text-cc-text">Culi<span className="text-cc-accent">Cars</span></span>
          </Link>
          <p className="text-cc-muted text-sm mt-3">Sign in to your account</p>
        </div>

        <div className="cc-card p-7">
          {error && (
            <div className="mb-5 bg-red-950/30 border border-red-600/40 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="cc-label">Email</label>
              <input
                type="email"
                className="cc-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                autoComplete="email"
              />
            </div>
            <div>
              <label className="cc-label">Password</label>
              <input
                type="password"
                className="cc-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="cc-btn-primary w-full py-3 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-cc-muted text-sm mt-5">
            Don't have an account?{' '}
            <Link href="/signup" className="text-cc-accent hover:text-cc-accent-dim transition-colors font-medium">
              Create one free
            </Link>
          </p>
        </div>

        <p className="text-center text-cc-faint text-xs mt-5">
          Stolen alerts and basic search are always free — no account needed.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-cc-border border-t-cc-accent animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
