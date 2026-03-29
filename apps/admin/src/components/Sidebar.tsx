// apps/admin/src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  AlertTriangle,
  ScanLine,
  CreditCard,
  Cpu,
  Car,
  Users,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const NAV = [
  { href: '/',                label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/reports',         label: 'Reports',          icon: FileText },
  { href: '/contributions',   label: 'Contributions',    icon: MessageSquare },
  { href: '/stolen-reports',  label: 'Stolen Reports',   icon: AlertTriangle },
  { href: '/ocr',             label: 'OCR Scans',        icon: ScanLine },
  { href: '/payments',        label: 'Payments',         icon: CreditCard },
  { href: '/scraper',         label: 'Scraper',          icon: Cpu },
  { href: '/vehicles',        label: 'Vehicles',         icon: Car },
  { href: '/users',           label: 'Users',            icon: Users },
  { href: '/settings',        label: 'Settings',         icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#111111] border-r border-white/6 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#D4A843] flex items-center justify-center">
            <Shield className="w-4 h-4 text-black" />
          </div>
          <div>
            <span className="text-base font-bold text-zinc-100 tracking-tight">CuliCars</span>
            <span className="block text-[10px] text-zinc-500 uppercase tracking-widest leading-none mt-0.5">Admin</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === '/'
                ? pathname === '/'
                : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#D4A843]/12 text-[#D4A843]'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/4'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  {href === '/stolen-reports' && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/6">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-200 hover:bg-white/4 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
