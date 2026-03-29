// apps/admin/src/app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');

  // CRITICAL: never trust requestUrl.origin — Plesk reports localhost
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    requestUrl.origin;

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL('/login?error=auth_failed', appUrl));
    }

    if (data.session) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.culicars.com'\;

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
          return NextResponse.redirect(new URL('/login?error=unauthorized', appUrl));
        }

        const profile = await profileRes.json();
        if (!['admin', 'employee'].includes(profile.role)) {
          await supabase.auth.signOut();
          return NextResponse.redirect(new URL('/login?error=unauthorized', appUrl));
        }
      } catch {
        return NextResponse.redirect(new URL('/login?error=auth_failed', appUrl));
      }
    }
  }

  return NextResponse.redirect(new URL('/', appUrl));
}
