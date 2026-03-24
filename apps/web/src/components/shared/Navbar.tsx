'use client';
// apps/web/src/components/shared/Navbar.tsx

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
  const { user, signOut, token } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const navLinks = [
    { href: '/how-it-works', label: 'How it Works' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/report-stolen', label: 'Report Stolen', highlight: true },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-cc-border bg-cc-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="text-cc-accent font-mono text-2xl font-bold tracking-tight">⬡</span>
            <span className="font-semibold text-lg text-cc-text">
              Culi<span className="text-cc-accent">Cars</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  link.highlight
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium'
                    : pathname === link.href
                    ? 'text-cc-text bg-cc-surface-2'
                    : 'text-cc-muted hover:text-cc-text hover:bg-cc-surface-2'
                }`}
              >
                {link.highlight && <span className="mr-1">🚨</span>}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link href="/dashboard" className="cc-btn-secondary text-xs px-3 py-2">
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="text-cc-muted hover:text-cc-text text-sm px-3 py-2 transition-colors">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="cc-btn-secondary text-xs px-3 py-2">
                  Sign in
                </Link>
                <Link href="/signup" className="cc-btn-primary text-xs px-3 py-2">
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-cc-muted hover:text-cc-text"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <div className="w-5 space-y-1.5">
              <span className={`block h-0.5 bg-current transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-cc-border bg-cc-surface">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2.5 text-sm rounded-md ${
                  link.highlight ? 'text-red-400' : 'text-cc-muted'
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.highlight && '🚨 '}{link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-cc-border flex flex-col gap-2">
              {user ? (
                <>
                  <Link href="/dashboard" className="cc-btn-secondary w-full" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <button onClick={handleSignOut} className="text-cc-muted text-sm text-left px-3 py-2">Sign out</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="cc-btn-secondary w-full text-center" onClick={() => setMobileOpen(false)}>Sign in</Link>
                  <Link href="/signup" className="cc-btn-primary w-full text-center" onClick={() => setMobileOpen(false)}>Get started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
