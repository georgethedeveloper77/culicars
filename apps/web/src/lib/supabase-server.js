"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = exports.getSession = exports.createServerSupabase = void 0;
// apps/web/src/lib/supabase-server.ts
const ssr_1 = require("@supabase/ssr");
const headers_1 = require("next/headers");
const createServerSupabase = () => {
    const cookieStore = (0, headers_1.cookies)();
    return (0, ssr_1.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                }
                catch { }
            },
        },
    });
};
exports.createServerSupabase = createServerSupabase;
const getSession = async () => {
    const supabase = (0, exports.createServerSupabase)();
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};
exports.getSession = getSession;
const getUser = async () => {
    const supabase = (0, exports.createServerSupabase)();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};
exports.getUser = getUser;
