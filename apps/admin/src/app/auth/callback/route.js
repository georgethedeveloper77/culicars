"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
// apps/admin/src/app/auth/callback/route.ts
const ssr_1 = require("@supabase/ssr");
const headers_1 = require("next/headers");
const server_1 = require("next/server");
async function GET(req) {
    const requestUrl = new URL(req.url);
    const code = requestUrl.searchParams.get('code');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        requestUrl.origin;
    if (code) {
        const cookieStore = (0, headers_1.cookies)();
        const supabase = (0, ssr_1.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
            cookies: {
                get(name) { return cookieStore.get(name)?.value; },
                set(name, value, options) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name, options) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        });
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
            return server_1.NextResponse.redirect(new URL('/login?error=auth_failed', appUrl));
        }
        if (data.session) {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.culicars.com';
                await fetch(`${apiUrl}/auth/complete-profile`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${data.session.access_token}`,
                    },
                    body: JSON.stringify({}),
                });
                const profileRes = await fetch(`${apiUrl}/auth/me`, {
                    headers: { Authorization: `Bearer ${data.session.access_token}` },
                });
                if (!profileRes.ok) {
                    await supabase.auth.signOut();
                    return server_1.NextResponse.redirect(new URL('/login?error=unauthorized', appUrl));
                }
                const profile = await profileRes.json();
                if (!['admin', 'employee'].includes(profile.role)) {
                    await supabase.auth.signOut();
                    return server_1.NextResponse.redirect(new URL('/login?error=unauthorized', appUrl));
                }
            }
            catch {
                return server_1.NextResponse.redirect(new URL('/login?error=auth_failed', appUrl));
            }
        }
    }
    return server_1.NextResponse.redirect(new URL('/', appUrl));
}
