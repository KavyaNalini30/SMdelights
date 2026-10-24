import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before account, admin and checkout pages:
 *  1. refreshes the Supabase session cookie (so server code sees a valid login);
 *  2. sends signed-out visitors to the login page.
 * The admin ROLE is checked again on the server in app/admin/layout.tsx and by RLS.
 */
const PUBLIC_ACCOUNT_PAGES = ["/account/login", "/account/signup", "/account/forgot-password"];

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Do not put code between createServerClient and getUser — it can cause random logouts.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const needsLogin =
    pathname.startsWith("/admin") ||
    (pathname.startsWith("/account") && !PUBLIC_ACCOUNT_PAGES.some((p) => pathname.startsWith(p)));

  if (needsLogin && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/account/login";
    login.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/checkout", "/auth/:path*"],
};
