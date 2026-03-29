// apps/admin/src/components/AdminLayoutShell.tsx
'use client';

import { usePathname } from 'next/navigation';
import { AdminAuthGuard } from './AdminAuthGuard';
import { Sidebar } from './Sidebar';

const PUBLIC_PATHS = ['/login'];

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}
