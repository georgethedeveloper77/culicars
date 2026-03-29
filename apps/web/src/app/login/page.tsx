// apps/web/src/app/login/page.tsx
'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/';

  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  function getSupabase() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async function handleGoogleLogin() {
    setLoading('google');
    setError(null);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) { setError(error.message); setLoading(null); }
  }

  async function handleAppleLogin() {
    setLoading('apple');
    setError(null);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) { setError(error.message); setLoading(null); }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Culi<span className="text-[#D4A843]">Cars</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Kenya Vehicle Intelligence</p>
        </div>
        <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-3">
          <h2 className="text-white font-semibold text-center mb-4">Sign in to your account</h2>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          <button
            onClick={handleGoogleLogin}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 hover:bg-gray-100 font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading === 'google' ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : <GoogleIcon />}
            Continue with Google
          </button>
          <button
            onClick={handleAppleLogin}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 bg-white/6 hover:bg-white/10 text-white border border-white/10 font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading === 'apple' ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
            ) : <AppleIcon />}
            Continue with Apple
          </button>
          <p className="text-xs text-zinc-500 text-center pt-2">
            By signing in you agree to our{' '}
            <a href="/terms" className="text-zinc-400 hover:text-white underline">Terms</a>{' '}
            and{' '}
            <a href="/privacy" className="text-zinc-400 hover:text-white underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#D4A843] border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <LoginForm />
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

function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 814 1000" fill="white">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46.3 761.4 0 656.4 0 553.2c0-203.1 125.6-310 249.8-310 66.2 0 121.4 43.4 162.8 43.4 39.5 0 101.7-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}