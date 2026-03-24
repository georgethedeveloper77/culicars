"use strict";
// apps/admin/src/components/AdminAuthGuard.tsx
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuthGuard = AdminAuthGuard;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const auth_helpers_nextjs_1 = require("@supabase/auth-helpers-nextjs");
function AdminAuthGuard({ children }) {
    const router = (0, navigation_1.useRouter)();
    const pathname = (0, navigation_1.usePathname)();
    const supabase = (0, auth_helpers_nextjs_1.createClientComponentClient)();
    const isLoginPage = pathname === '/login';
    // Don't show spinner on login page
    const [checking, setChecking] = (0, react_1.useState)(!isLoginPage);
    (0, react_1.useEffect)(() => {
        if (isLoginPage)
            return;
        async function check() {
            try {
                const { data: sessionData, error } = await supabase.auth.getSession();
                if (error || !sessionData.session) {
                    router.replace('/login');
                    return;
                }
                const user = sessionData.session.user;
                console.log('[AdminAuthGuard] app_metadata:', user.app_metadata);
                const role = user.app_metadata?.role ??
                    user.user_metadata?.role ??
                    user.app_metadata?.userrole;
                console.log('[AdminAuthGuard] role:', role);
                if (role !== 'admin') {
                    router.replace('/login?error=unauthorized');
                    return;
                }
                setChecking(false);
            }
            catch (err) {
                console.error('[AdminAuthGuard] error:', err);
                router.replace('/login');
            }
        }
        check();
    }, [isLoginPage, router, supabase, pathname]);
    // Login page — no guard needed
    if (isLoginPage)
        return <>{children}</>;
    // Waiting for auth check
    if (checking) {
        return (<div className="min-h-screen bg-[#0E0E0E] flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <div className="w-5 h-5 border-2 border-[#D4A843] border-t-transparent rounded-full animate-spin"/>
          <span className="text-sm">Verifying admin access…</span>
        </div>
      </div>);
    }
    return <>{children}</>;
}
