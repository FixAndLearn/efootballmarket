import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSuperAdminEmail } from "./lib/security/adminAuth";

const EXTERNAL_WEBHOOK_PATHS = [
  "/api/payments/mpesa/callback",
  "/api/whatsapp/webhook",
];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Must stay in sync with PAGE_SIZE in app/(marketplace)/browse/page.tsx. */
const BROWSE_PAGE_SIZE = 24;

/**
 * Next.js Edge Security Middleware
 * 1. Enforces Cross-Site Request Forgery (CSRF) Same-Origin verification on mutating /api/* calls.
 * 2. Synchronizes Supabase SSR auth cookies.
 * 3. Enforces strict Role-Based Access Control (RBAC) on /admin routes.
 * 4. Sends stale /browse?page=N deep links to real stock with a true 307.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Edge CSRF Origin Firewall for browser-initiated state mutations
  if (
    pathname.startsWith("/api/") &&
    MUTATING_METHODS.has(request.method) &&
    !EXTERNAL_WEBHOOK_PATHS.some((p) => pathname.startsWith(p))
  ) {
    const isServerBearerRoute =
      (pathname.startsWith("/api/cron/") || pathname.startsWith("/api/admin/")) &&
      Boolean(request.headers.get("authorization")?.startsWith("Bearer "));
    const originHeader = request.headers.get("origin");
    const secFetchSite = request.headers.get("sec-fetch-site");
    const hostHeader =
      request.headers.get("x-forwarded-host") || request.headers.get("host");

    if (!isServerBearerRoute && !originHeader && secFetchSite === "cross-site") {
      return NextResponse.json(
        { error: "Forbidden: Cross-site request blocked by Edge Fetch-Metadata policy." },
        { status: 403 }
      );
    }

    if (!isServerBearerRoute && originHeader && hostHeader) {
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

  // ---------------------------------------------------------------------
  // 1b. Real HTTP redirect for stale /browse?page=N deep links.
  //
  // The page component clamps out-of-range pages too, but it cannot emit a
  // status code: the route's loading.tsx makes Next flush the shell first, so
  // a redirect() there becomes a client-side navigation streamed inside a 200.
  // A shopper's browser recovers, but crawlers and link previews see an empty
  // catalogue. This runs before rendering, so the response is a genuine 307.
  //
  // Soundness: filters can only ever shrink the published set, so if the page
  // number is past the end of the UNFILTERED set it is past the end of every
  // filtered set too. That lets this check redirect without reimplementing the
  // page's filter validation, and it can never send a valid URL away.
  // Skipped for page 1 (the overwhelming majority of traffic) so the common
  // path pays nothing.
  // ---------------------------------------------------------------------
  if (pathname === "/browse") {
    const rawPage = request.nextUrl.searchParams.get("page");
    const requestedPage = rawPage && /^\d+$/.test(rawPage) ? Number(rawPage) : 1;

    if (Number.isFinite(requestedPage) && requestedPage > 1) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey && !supabaseUrl.includes("placeholder-project")) {
        try {
          const countRes = await fetch(
            `${supabaseUrl}/rest/v1/listings?select=id&status=eq.published`,
            {
              method: "HEAD",
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                Prefer: "count=exact",
                Range: "0-0",
              },
              next: { revalidate: 60 },
            }
          );

          // e.g. "content-range: 0-0/19"
          const total = Number(
            (countRes.headers.get("content-range") || "").split("/")[1]
          );

          if (Number.isFinite(total) && total >= 0) {
            const lastPage = Math.max(1, Math.ceil(total / BROWSE_PAGE_SIZE));
            if (requestedPage > lastPage) {
              const target = new URL("/browse", request.url);
              request.nextUrl.searchParams.forEach((v, k) => {
                if (k !== "page" && v && !(k === "sortBy" && v === "newest")) {
                  target.searchParams.set(k, v);
                }
              });
              return NextResponse.redirect(target, 307);
            }
          }
        } catch {
          // Fail open: the page-level clamp is still there as a safety net.
        }
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

    const isSuperAdmin = isSuperAdminEmail(user.email);

    if (!isSuperAdmin) {
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
    "/((?!_next/static|_next/image|sw\\.js|ads\\.txt|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|favicon\\.ico|google.*\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|xml)$).*)",
  ],
};
