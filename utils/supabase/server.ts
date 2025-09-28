import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { adaptCookieOptions } from "@/utils/supabase/cookie-helpers";

export async function createSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieOptions = adaptCookieOptions(options);
            cookieStore.set({
              name,
              value,
              ...(cookieOptions ?? {}),
            });
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if middleware keeps sessions in sync.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            const cookieOptions = adaptCookieOptions(options);
            cookieStore.set({
              name,
              value: '',
              ...(cookieOptions ?? {}),
              maxAge: 0,
            });
          } catch {
            // Ignore remove attempts during static render/server components
          }
        },
      },
    }
  );
}

// For API routes - uses NextRequest cookies for consistent handling
export function createSupabaseClientFromRequest(request: NextRequest) {
  return createServerClient(
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
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(_name: string, _value: string, _options: CookieOptions) {
          // Read-only for API routes - cookies should be set by middleware
        },
        remove(_name: string, _options: CookieOptions) {
          // No-op for API routes
        },
      },
    }
  );
}

// Create a synchronous client for static contexts (fallback to admin client)
export function createStaticSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // Fallback to admin client for static generation
    return null;
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get() {
        return undefined;
      },
      set(_name: string, _value: string, _options: CookieOptions) {
        // No-op for static generation
      },
      remove(_name: string, _options: CookieOptions) {
        // No-op for static generation
      },
    },
  });
}
