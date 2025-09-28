import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isServerSideDemoMode } from "@/utils/demo-mode";
import { adaptCookieOptions } from "@/utils/supabase/cookie-helpers";
import { getCachedSession, setCachedSession } from "@/utils/supabase/session-cache";

function withSupabaseCookies(
  supabaseResponse: NextResponse,
  response: NextResponse
) {
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      expires: cookie.expires,
      maxAge: cookie.maxAge,
      partitioned: cookie.partitioned,
      priority: cookie.priority,
    });
  });
  return response;
}

export async function updateSession(request: NextRequest) {
  // Check for demo mode first
  const demoMode = isServerSideDemoMode(request.url);

  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip Supabase initialization if in demo mode
  if (demoMode) {
    console.log(
      "🎭 Demo mode enabled - bypassing authentication for URL:",
      request.url
    );
    // Add demo mode header for client-side detection
    supabaseResponse.headers.set("x-demo-mode", "true");
    return supabaseResponse;
  }

  const supabase = createServerClient(
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
        set(name: string, value: string, options: CookieOptions) {
          const cookieOptions = adaptCookieOptions(options);

          request.cookies.set({
            name,
            value,
            ...(cookieOptions ?? {}),
          });

          supabaseResponse = withSupabaseCookies(
            supabaseResponse,
            NextResponse.next({ request })
          );

          supabaseResponse.cookies.set({
            name,
            value,
            ...(cookieOptions ?? {}),
          });
        },
        remove(name: string, options: CookieOptions) {
          const cookieOptions = adaptCookieOptions(options);

          request.cookies.set({
            name,
            value: '',
            ...(cookieOptions ?? {}),
            maxAge: 0,
          });

          supabaseResponse = withSupabaseCookies(
            supabaseResponse,
            NextResponse.next({ request })
          );

          supabaseResponse.cookies.set({
            name,
            value: '',
            ...(cookieOptions ?? {}),
            maxAge: 0,
          });
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Handle OAuth callback with code exchange in middleware
  if (request.nextUrl.pathname === "/auth/callback") {
    const code = request.nextUrl.searchParams.get("code");
    const error = request.nextUrl.searchParams.get("error");

    console.log("🔄 Middleware: OAuth callback detectado:", {
      hasCode: !!code,
      code: code?.substring(0, 20) + '...',
      error
    });

    if (error) {
      console.error("❌ Middleware: Error en OAuth callback:", error);
      return withSupabaseCookies(
        supabaseResponse,
        NextResponse.redirect(
          new URL(`/sign-in?error=${encodeURIComponent(error)}`, request.url)
        )
      );
    }

    if (code) {
      console.log("🔄 Middleware: Intercambiando código OAuth por sesión");
      const { data: exchangeData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      console.log("🔑 Middleware: Resultado exchangeCodeForSession:", {
        hasSession: !!exchangeData?.session,
        hasUser: !!exchangeData?.session?.user,
        userId: exchangeData?.session?.user?.id,
        userEmail: exchangeData?.session?.user?.email,
        exchangeError: exchangeError?.message,
      });

      if (exchangeError) {
        console.error(
          "❌ Middleware: Error durante exchangeCodeForSession:",
          exchangeError.message
        );
        return withSupabaseCookies(
          supabaseResponse,
          NextResponse.redirect(
            new URL(
              `/sign-in?error=${encodeURIComponent(exchangeError.message)}`,
              request.url
            )
          )
        );
      }

      const userAfterExchange = await supabase.auth.getUser();

      console.log("🔑 Middleware: Resultado después de detectar sesión:", {
        hasUser: !!userAfterExchange.data.user,
        userId: userAfterExchange.data.user?.id,
        userEmail: userAfterExchange.data.user?.email,
        error: userAfterExchange.error?.message,
      });

      if (userAfterExchange.data.user) {
        console.log("✅ Middleware: Sesión OAuth establecida, redirigiendo a dashboard");
        return withSupabaseCookies(
          supabaseResponse,
          NextResponse.redirect(new URL("/dashboard", request.url))
        );
      } else if (userAfterExchange.error) {
        console.error(
          "❌ Middleware: Error estableciendo sesión OAuth:",
          userAfterExchange.error.message
        );
        return withSupabaseCookies(
          supabaseResponse,
          NextResponse.redirect(
            new URL(
              `/sign-in?error=${encodeURIComponent(userAfterExchange.error.message)}`,
              request.url
            )
          )
        );
      }
    }

    // Fallback: redirect to sign-in if no code or user
    console.log("⚠️ Middleware: OAuth callback sin código válido, redirigiendo a sign-in");
    return withSupabaseCookies(
      supabaseResponse,
      NextResponse.redirect(
        new URL(
          "/sign-in?error=Código de autorización faltante",
          request.url
        )
      )
    );
  }

  // Try to get user from cache first to reduce OAuth calls
  let user = getCachedSession(request.cookies);
  let isFromCache = !!user;

  if (!user) {
    const authResult = await supabase.auth.getUser();
    user = authResult;

    // Cache successful authentication
    if (authResult.data.user && !authResult.error) {
      setCachedSession(request.cookies, authResult);
    }
  }

  // Debug logging for authentication issues
  if (request.nextUrl.pathname.startsWith("/api/academia")) {
    console.log("🔐 Middleware auth check for API route:", {
      path: request.nextUrl.pathname,
      hasUser: !!user.data.user,
      userId: user.data.user?.id,
      authError: user.error?.message,
      hasSupabaseCookies: request.cookies
        .getAll()
        .some((c) => c.name.includes("supabase")),
    });
  }

  // Redirect authenticated users away from sign-in and sign-up pages
  if ((request.nextUrl.pathname === "/sign-in" || request.nextUrl.pathname === "/sign-up") && !user.error && user.data.user) {
    console.log("🔄 Middleware: Usuario autenticado intentando acceder a sign-in, redirigiendo a dashboard");
    return withSupabaseCookies(
      supabaseResponse,
      NextResponse.redirect(new URL("/dashboard", request.url))
    );
  }

  // Protect /protected, /dashboard, and /admin routes (unless in demo mode)
  if (
    request.nextUrl.pathname.startsWith("/protected") ||
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/admin")
  ) {
    // Reduce logging frequency to prevent spam
    const shouldLog = Math.random() < 0.1; // Log only 10% of requests
    if (shouldLog) {
      console.log("🔐 Middleware: Verificando acceso a ruta protegida:", {
        path: request.nextUrl.pathname,
        hasUser: !!user.data.user,
        userId: user.data.user?.id,
        userEmail: user.data.user?.email,
        authError: user.error?.message,
        fromCache: isFromCache,
        hasSupabaseCookies: request.cookies
          .getAll()
          .some((c) => c.name.includes("supabase")),
        cookieCount: request.cookies.getAll().length
      });
    }

    if (user.error) {
      console.log("❌ Middleware: Error de autenticación, redirigiendo a sign-in:", user.error.message);
      return withSupabaseCookies(
        supabaseResponse,
        NextResponse.redirect(new URL("/sign-in", request.url))
      );
    }

    if (!user.data.user) {
      console.log("❌ Middleware: No hay usuario, redirigiendo a sign-in");
      return withSupabaseCookies(
        supabaseResponse,
        NextResponse.redirect(new URL("/sign-in", request.url))
      );
    }

    if (shouldLog) {
      console.log("✅ Middleware: Usuario válido, permitiendo acceso a", request.nextUrl.pathname);
    }
  }

  // Redirect logged in users from home based on their role
  if (request.nextUrl.pathname === "/" && !user.error) {
    try {
      // Check if user is an admin
      const { data: adminUser, error: adminError } = await supabase
        .from("admin_users")
        .select("role, active")
        .eq("user_id", user.data.user.id)
        .eq("active", true)
        .maybeSingle();

      console.log("Middleware - User ID:", user.data.user.id);
      console.log("Middleware - Admin query result:", adminUser);
      console.log("Middleware - Admin query error:", adminError);

      if (
        adminUser &&
        (adminUser.role === "super_admin" || adminUser.role === "admin")
      ) {
        console.log("Redirecting to /admin");
        return withSupabaseCookies(
          supabaseResponse,
          NextResponse.redirect(new URL("/admin", request.url))
        );
      }

      console.log("Redirecting to /dashboard");
      return withSupabaseCookies(
        supabaseResponse,
        NextResponse.redirect(new URL("/dashboard", request.url))
      );
    } catch (error) {
      console.error("Middleware error:", error);
      return withSupabaseCookies(
        supabaseResponse,
        NextResponse.redirect(new URL("/dashboard", request.url))
      );
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
