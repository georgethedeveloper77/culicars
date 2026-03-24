// apps/admin/src/lib/api.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function getToken(): Promise<string | null> {
  const supabase = createClientComponentClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
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
  return (json.data ?? json) as T;
}

export const apiGet = <T>(path: string) => apiFetch<T>(path);

export const apiPost = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

export const apiPatch = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });

export const apiDelete = <T>(path: string) =>
  apiFetch<T>(path, { method: 'DELETE' });
