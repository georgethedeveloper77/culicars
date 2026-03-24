"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
// apps/web/src/middleware.ts
const ssr_1 = require("@supabase/ssr");
const server_1 = require("next/server");
const PROTECTED_ROUTES = ['/dashboard', '/dashboard/reports', '/dashboard/billing'];
async function middleware(request) {
    let supabaseResponse = server_1.NextResponse.next({ request });
    const supabase = (0, ssr_1.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                supabaseResponse = server_1.NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
            },
        },
    });
    const { data: { user } } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;
    const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    if (isProtected && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', pathname);
        return server_1.NextResponse.redirect(url);
    }
    // Already logged in visiting login/signup
    if (user && (pathname === '/login' || pathname === '/signup')) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return server_1.NextResponse.redirect(url);
    }
    return supabaseResponse;
}
exports.config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
