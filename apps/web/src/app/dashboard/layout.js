"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardLayout;
// apps/web/src/app/dashboard/layout.tsx
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const auth_context_1 = require("@/lib/auth-context");
const NAV_ITEMS = [
    { href: '/dashboard', label: 'Overview', icon: '📊', exact: true },
    { href: '/dashboard/reports', label: 'My Reports', icon: '📋' },
    { href: '/dashboard/billing', label: 'Credits & Billing', icon: '💳' },
];
function DashboardLayout({ children }) {
    const { user, loading, signOut } = (0, auth_context_1.useAuth)();
    const router = (0, navigation_1.useRouter)();
    const pathname = (0, navigation_1.usePathname)();
    (0, react_1.useEffect)(() => {
        if (!loading && !user) {
            router.push(`/login?next=${pathname}`);
        }
    }, [user, loading, pathname]);
    if (loading || !user) {
        return (<div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-cc-border border-t-cc-accent animate-spin"/>
      </div>);
    }
    return (<div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-52 shrink-0">
          <div className="cc-card p-4 space-y-1">
            {/* User pill */}
            <div className="px-2 py-2.5 mb-3 border-b border-cc-border">
              <p className="text-xs text-cc-muted truncate">{user.email}</p>
            </div>

            {NAV_ITEMS.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (<link_1.default key={item.href} href={item.href} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${active
                    ? 'bg-cc-accent/10 text-cc-accent font-medium'
                    : 'text-cc-muted hover:text-cc-text hover:bg-cc-surface-2'}`}>
                  <span>{item.icon}</span>
                  {item.label}
                </link_1.default>);
        })}

            <div className="pt-3 border-t border-cc-border mt-2">
              <button onClick={() => { signOut(); router.push('/'); }} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-cc-muted hover:text-cc-text hover:bg-cc-surface-2 w-full transition-colors">
                <span>↩</span> Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>);
}
