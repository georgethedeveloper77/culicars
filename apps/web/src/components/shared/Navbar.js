"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Navbar = Navbar;
// apps/web/src/components/shared/Navbar.tsx
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const navigation_1 = require("next/navigation");
const auth_context_1 = require("@/lib/auth-context");
function Navbar() {
    const { user, signOut, token } = (0, auth_context_1.useAuth)();
    const pathname = (0, navigation_1.usePathname)();
    const router = (0, navigation_1.useRouter)();
    const [mobileOpen, setMobileOpen] = (0, react_1.useState)(false);
    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };
    const navLinks = [
        { href: '/how-it-works', label: 'How it Works' },
        { href: '/pricing', label: 'Pricing' },
        { href: '/report-stolen', label: 'Report Stolen', highlight: true },
    ];
    return (<nav className="sticky top-0 z-50 border-b border-cc-border bg-cc-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <link_1.default href="/" className="flex items-center gap-2.5 group">
            <span className="text-cc-accent font-mono text-2xl font-bold tracking-tight">⬡</span>
            <span className="font-semibold text-lg text-cc-text">
              Culi<span className="text-cc-accent">Cars</span>
            </span>
          </link_1.default>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (<link_1.default key={link.href} href={link.href} className={`px-3 py-2 text-sm rounded-md transition-colors ${link.highlight
                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium'
                : pathname === link.href
                    ? 'text-cc-text bg-cc-surface-2'
                    : 'text-cc-muted hover:text-cc-text hover:bg-cc-surface-2'}`}>
                {link.highlight && <span className="mr-1">🚨</span>}
                {link.label}
              </link_1.default>))}
          </div>

          {/* Auth */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (<>
                <link_1.default href="/dashboard" className="cc-btn-secondary text-xs px-3 py-2">
                  Dashboard
                </link_1.default>
                <button onClick={handleSignOut} className="text-cc-muted hover:text-cc-text text-sm px-3 py-2 transition-colors">
                  Sign out
                </button>
              </>) : (<>
                <link_1.default href="/login" className="cc-btn-secondary text-xs px-3 py-2">
                  Sign in
                </link_1.default>
                <link_1.default href="/signup" className="cc-btn-primary text-xs px-3 py-2">
                  Get started
                </link_1.default>
              </>)}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-md text-cc-muted hover:text-cc-text" onClick={() => setMobileOpen(!mobileOpen)}>
            <div className="w-5 space-y-1.5">
              <span className={`block h-0.5 bg-current transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`}/>
              <span className={`block h-0.5 bg-current transition-all ${mobileOpen ? 'opacity-0' : ''}`}/>
              <span className={`block h-0.5 bg-current transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`}/>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (<div className="md:hidden border-t border-cc-border bg-cc-surface">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (<link_1.default key={link.href} href={link.href} className={`block px-3 py-2.5 text-sm rounded-md ${link.highlight ? 'text-red-400' : 'text-cc-muted'}`} onClick={() => setMobileOpen(false)}>
                {link.highlight && '🚨 '}{link.label}
              </link_1.default>))}
            <div className="pt-2 border-t border-cc-border flex flex-col gap-2">
              {user ? (<>
                  <link_1.default href="/dashboard" className="cc-btn-secondary w-full" onClick={() => setMobileOpen(false)}>Dashboard</link_1.default>
                  <button onClick={handleSignOut} className="text-cc-muted text-sm text-left px-3 py-2">Sign out</button>
                </>) : (<>
                  <link_1.default href="/login" className="cc-btn-secondary w-full text-center" onClick={() => setMobileOpen(false)}>Sign in</link_1.default>
                  <link_1.default href="/signup" className="cc-btn-primary w-full text-center" onClick={() => setMobileOpen(false)}>Get started</link_1.default>
                </>)}
            </div>
          </div>
        </div>)}
    </nav>);
}
