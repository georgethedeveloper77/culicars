// apps/admin/src/components/AdminAuthGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const isLoginPage = pathname === '/login';
  // Don't show spinner on login page
  const [checking, setChecking] = useState(!isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;

    async function check() {
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();

        if (error || !sessionData.session) {
          router.replace('/login');
          return;
        }

        const user = sessionData.session.user;
        console.log('[AdminAuthGuard] app_metadata:', user.app_metadata);

        const role =
          user.app_metadata?.role ??
          user.user_metadata?.role ??
          user.app_metadata?.userrole;

        console.log('[AdminAuthGuard] role:', role);

        if (role !== 'admin') {
          router.replace('/login?error=unauthorized');
          return;
        }

        setChecking(false);
      } catch (err) {
        console.error('[AdminAuthGuard] error:', err);
        router.replace('/login');
      }
    }

    check();
  }, [isLoginPage, router, supabase, pathname]);

  // Login page — no guard needed
  if (isLoginPage) return <>{children}</>;

  // Waiting for auth check
  if (checking) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <div className="w-5 h-5 border-2 border-[#D4A843] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Verifying admin access…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
