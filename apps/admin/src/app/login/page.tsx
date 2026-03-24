'use client';
// apps/admin/src/app/login/page.tsx

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUnauthorized = searchParams.get('error') === 'unauthorized';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    isUnauthorized ? 'Access denied. Admin role required.' : null
  );

  const supabase = createClientComponentClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const role =
      data.session?.user.app_metadata?.role ??
      data.session?.user.user_metadata?.role;

    if (role !== 'admin') {
      await supabase.auth.signOut();
      setError('Access denied. This account does not have admin privileges.');
      setLoading(false);
      return;
    }

    router.push('/');
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl bg-[#D4A843] flex items-center justify-center">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-zinc-100 leading-none">CuliCars</p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-[#141414] border border-white/8 rounded-2xl p-8"
        >
          <h1 className="text-lg font-semibold text-zinc-100 mb-6">Sign in</h1>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-[#0E0E0E] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#D4A843]/60"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-[#0E0E0E] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#D4A843]/60 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full py-2.5 rounded-lg bg-[#D4A843] hover:bg-[#E8C060] text-black text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6">
          admin.culicars.com — restricted access
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <LoginPageInner />
    </Suspense>
  );
}
