"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiDelete = exports.apiPatch = exports.apiPost = exports.apiGet = void 0;
// apps/admin/src/lib/api.ts
const auth_helpers_nextjs_1 = require("@supabase/auth-helpers-nextjs");
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
async function getToken() {
    const supabase = (0, auth_helpers_nextjs_1.createClientComponentClient)();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
}
async function apiFetch(path, options = {}) {
    const token = await getToken();
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message ?? `HTTP ${res.status}`);
    }
    const json = await res.json();
    // Unwrap { success, data } envelope
    return (json.data ?? json);
}
const apiGet = (path) => apiFetch(path);
exports.apiGet = apiGet;
const apiPost = (path, body) => apiFetch(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
});
exports.apiPost = apiPost;
const apiPatch = (path, body) => apiFetch(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
});
exports.apiPatch = apiPatch;
const apiDelete = (path) => apiFetch(path, { method: 'DELETE' });
exports.apiDelete = apiDelete;
