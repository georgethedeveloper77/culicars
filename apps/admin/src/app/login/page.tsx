// apps/admin/src/app/login/page.tsx
'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Shield } from 'lucide-react';

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const isUnauthorized = searchParams.get('error') === 'unauthorized';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    isUnauthorized ? 'Access denied. Admin or employee role required.' : null
  );

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#D4A843]/10 border border-[#D4A843]/20 rounded-xl mb-4">
            <Shield className="w-6 h-6 text-[#D4A843]" />
          </div>
          <h1 className="text-xl font-bold text-white">
            CuliCars <span className="text-[#D4A843]">Admin</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Staff access only</p>
        </div>

        <div className="bg-white/4 border border-white/8 rounded-2xl p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 hover:bg-gray-100 font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? 'Signing in…' : 'Sign in with Google'}
          </button>

          <p className="text-xs text-zinc-600 text-center mt-4">
            Only accounts with admin or employee role can access this panel.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#D4A843] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
      <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}
