import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PRIMARY_SUPER_ADMIN_EMAIL } from "./lib/security/adminAuth";

const EXTERNAL_WEBHOOK_PATHS = [
  "/api/payments/mpesa/callback",
  "/api/telegram/webhook",
  "/api/whatsapp/webhook",
];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Next.js Edge Security Middleware
 * 1. Enforces Cross-Site Request Forgery (CSRF) Same-Origin verification on mutating /api/* calls.
 * 2. Synchronizes Supabase SSR auth cookies.
 * 3. Enforces strict Role-Based Access Control (RBAC) on /admin routes.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Edge CSRF Origin Firewall for browser-initiated state mutations
  if (
    pathname.startsWith("/api/") &&
    MUTATING_METHODS.has(request.method) &&
    !EXTERNAL_WEBHOOK_PATHS.some((p) => pathname.startsWith(p))
  ) {
    const hasBearerSecret = request.headers.get("authorization")?.startsWith("Bearer ");
    const originHeader = request.headers.get("origin");
    const hostHeader =
      request.headers.get("x-forwarded-host") || request.headers.get("host");

    if (!hasBearerSecret && originHeader && hostHeader) {
      try {
        const originHost = new URL(originHeader).host.toLowerCase();
        const expectedHosts = hostHeader
          .split(",")
          .map((h) => h.trim().toLowerCase())
          .filter(Boolean);

        if (!expectedHosts.includes(originHost)) {
          return NextResponse.json(
            { error: "Forbidden: Cross-origin request blocked by Edge CSRF policy." },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Forbidden: Malformed Origin header." },
          { status: 403 }
        );
      }
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder-project")) {
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
        .select("role, is_suspended")
        .eq("id", user.id)
        .single();

      const userRole = profile?.role;
      const hasAdminRole =
        !profile?.is_suspended && (userRole === "admin" || userRole === "super_admin");

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
    "/api/:path*",
    "/((?!_next/static|_next/image|ads\\.txt|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|favicon\\.ico|google.*\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|xml)$).*)",
  ],
};
