import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      cookies: {
        getAll() {
          return document.cookie
            .split(';')
            .map(cookie => cookie.trim().split('='))
            .filter(([name]) => name)
            .map(([name, value]) => ({ name, value: decodeURIComponent(value || '') }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options = {} }) => {
            const cookieOptions = [];
            if (options.maxAge) cookieOptions.push(`max-age=${options.maxAge}`);
            if (options.domain) cookieOptions.push(`domain=${options.domain}`);
            if (options.path) cookieOptions.push(`path=${options.path}`);
            if (options.secure) cookieOptions.push('secure');
            if (options.httpOnly) cookieOptions.push('httponly');
            if (options.sameSite) cookieOptions.push(`samesite=${options.sameSite}`);

            const cookieString = `${name}=${encodeURIComponent(value)}${cookieOptions.length ? '; ' + cookieOptions.join('; ') : ''}`;
            document.cookie = cookieString;
          });
        },
      },
    }
  );
}

// Alias for compatibility
export const createClient = createSupabaseClient;
