// apps/admin/src/components/AdminAuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface AdminAuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function AdminAuthGuard({
  children,
  allowedRoles = ['admin', 'employee'],
}: AdminAuthGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function check() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.culicars.com';
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) {
          router.replace('/login?error=unauthorized');
          return;
        }

        const profile = await res.json();

        if (!allowedRoles.includes(profile.role)) {
          router.replace('/login?error=unauthorized');
          return;
        }

        setStatus('authorized');
      } catch {
        router.replace('/login?error=unauthorized');
      }
    }

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/login');
    });

    return () => subscription.unsubscribe();
  }, [router, allowedRoles]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#D4A843] border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') return null;

  return <>{children}</>;
}
