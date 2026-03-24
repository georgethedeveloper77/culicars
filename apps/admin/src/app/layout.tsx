// apps/admin/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { AdminAuthGuard } from '@/components/AdminAuthGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CuliCars Admin',
  description: 'CuliCars Administration Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0E0E0E] text-zinc-100 min-h-screen`}>
        <AdminAuthGuard>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen">
              <div className="p-8">
                {children}
              </div>
            </main>
          </div>
        </AdminAuthGuard>
      </body>
    </html>
  );
}
