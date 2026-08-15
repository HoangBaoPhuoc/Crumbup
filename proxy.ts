import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

async function getAdminToken(): Promise<string> {
  const email  = process.env.ADMIN_EMAIL    ?? "";
  const pw     = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.ADMIN_SECRET   ?? "crumbup-admin-secret";
  const data   = new TextEncoder().encode(`${email}:${pw}:${secret}`);
  const buf    = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin route protection ──────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const reqHeaders = new Headers(request.headers);
    reqHeaders.set("x-pathname", pathname);
    if (pathname === "/admin/login") {
      return NextResponse.next({ request: { headers: reqHeaders } });
    }
    const session = request.cookies.get("admin_session")?.value;
    const token   = await getAdminToken();
    if (!session || session !== token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next({ request: { headers: reqHeaders } });
  }

  // ── Supabase user routes ────────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { maxAge: 60 * 60 * 24 },
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isBusiness = user?.user_metadata?.role === "BUSINESS";

  // ── Business accounts: can only access /partner and /api/* ─────────────
  if (isBusiness && !pathname.startsWith("/partner") && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/partner", request.url));
  }

  // ── Protect user-only routes ───────────────────────────────────────────
  const protectedPaths = ["/profile", "/orders", "/partner", "/review", "/messages"];
  if (protectedPaths.some((p) => pathname.startsWith(p)) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Already logged-in users should not see login/register ─────────────
  if (user && ["/login", "/register"].includes(pathname)) {
    const dest = isBusiness ? "/partner" : "/discover";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
