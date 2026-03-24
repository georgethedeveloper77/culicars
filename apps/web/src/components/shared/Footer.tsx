// apps/web/src/components/shared/Footer.tsx
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-cc-border bg-cc-surface mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-cc-accent font-mono text-xl font-bold">⬡</span>
              <span className="font-semibold text-cc-text">Culi<span className="text-cc-accent">Cars</span></span>
            </div>
            <p className="text-cc-muted text-sm leading-relaxed">
              Kenya's vehicle history intelligence platform. Know before you buy.
            </p>
            <p className="text-cc-faint text-xs mt-3">
              Nairobi, Kenya 🇰🇪
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-cc-muted uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2">
              {[
                ['/', 'Search a Vehicle'],
                ['/how-it-works', 'How it Works'],
                ['/pricing', 'Pricing'],
                ['/report-stolen', 'Report Stolen'],
                ['/contribute', 'Contribute Data'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-cc-muted hover:text-cc-text transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold text-cc-muted uppercase tracking-wider mb-3">Account</h4>
            <ul className="space-y-2">
              {[
                ['/signup', 'Create Account'],
                ['/login', 'Sign In'],
                ['/dashboard', 'Dashboard'],
                ['/dashboard/reports', 'My Reports'],
                ['/dashboard/billing', 'Billing'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-cc-muted hover:text-cc-text transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-cc-muted uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-2">
              {[
                ['/privacy', 'Privacy Policy'],
                ['/terms', 'Terms of Use'],
                ['/data-sources', 'Data Sources'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-cc-muted hover:text-cc-text transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-cc-border flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-cc-faint text-xs">
            © {new Date().getFullYear()} CuliCars. All rights reserved.
          </p>
          <p className="text-cc-faint text-xs">
            Data sourced from NTSA, KRA, community contributors &amp; 13 scrapers
          </p>
        </div>
      </div>
    </footer>
  );
}
