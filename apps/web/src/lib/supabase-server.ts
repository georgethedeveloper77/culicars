// apps/web/src/lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createServerSupabase = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
};

export const getSession = async () => {
  const supabase = createServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const getUser = async () => {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
