// apps/admin/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AdminLayoutShell } from '@/components/AdminLayoutShell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CuliCars Admin',
  description: 'CuliCars Administration Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0E0E0E] text-zinc-100 min-h-screen`}>
        <AdminLayoutShell>{children}</AdminLayoutShell>
      </body>
    </html>
  );
}
