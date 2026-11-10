import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PRIMARY_SUPER_ADMIN_EMAIL } from "./lib/security/adminAuth";

/**
 * Next.js Edge Middleware
 * 1. Synchronizes Supabase auth session cookies.
 * 2. Enforces strict Role-Based Access Control (RBAC) on /admin routes.
 * 3. Excludes crawler verification & static metadata files (ads.txt, robots.txt, sitemap.xml).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isSuperAdminEmail =
      user.email?.trim().toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase();

    if (!isSuperAdminEmail) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const userRole = profile?.role;
      const hasAdminRole = userRole === "admin" || userRole === "super_admin";

      if (profileError || !hasAdminRole) {
        const forbiddenUrl = new URL("/", request.url);
        forbiddenUrl.searchParams.set("error", "unauthorized_admin_access");
        return NextResponse.redirect(forbiddenUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|ads\\.txt|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|favicon\\.ico|google.*\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|xml)$).*)",
  ],
};
