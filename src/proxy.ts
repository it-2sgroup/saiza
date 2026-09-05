import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { decodeJwtClaims } from "@/lib/admin/jwt";

// decodeJwtClaims reads the `user_role` custom claim set by the
// `custom_access_token_hook` SQL function (see
// supabase/migrations/0002_security_hardening.sql) — once that hook is
// enabled in the Supabase Dashboard, the role travels inside the
// already-verified JWT, so middleware can act on it without a second
// round-trip to the `profiles` table.

function buildCsp(nonce: string) {
  // React's dev-mode tooling (component stack reconstruction) needs eval() —
  // it never uses eval() in production, so this only loosens the policy
  // locally, not for real visitors.
  const scriptSrc =
    process.env.NODE_ENV === "development"
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  return [
    "default-src 'self'",
    scriptSrc,
    // Inline style ATTRIBUTES are used extensively for dynamic values
    // (carousel transforms, computed colors) across the site — CSP has no
    // practical nonce mechanism for those, so style-src stays permissive.
    // The XSS impact of style injection alone is far lower than script
    // injection, which is what script-src above is actually locking down.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "font-src 'self' data:",
    "frame-src https://www.google.com https://www.youtube-nocookie.com https://*.larksuite.com",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Must also be set on the REQUEST headers, not just the response — Next.js
  // reads the nonce it stamps onto its own <script> tags from the request's
  // CSP header. Without this, the nonce on the response is real but nothing
  // in the actual HTML ever carries it, and 'strict-dynamic' (which drops
  // 'self' as a fallback per CSP3) blocks every one of Next's own bundles.
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return response;
  }

  // Admin-only from here: verify the session and gate access. Kept out of
  // the public-page path above so ordinary pages don't pay for a Supabase
  // round-trip on every request.
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        response.headers.set("Content-Security-Policy", csp);
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginRoute = pathname === "/admin/login";
  // Invite links land here with the session only established client-side
  // (token lives in the URL hash, invisible to this server-side check).
  const isSetPasswordRoute = pathname === "/admin/set-password";

  if (!isLoginRoute && !isSetPasswordRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (isLoginRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  // Extra, earlier gate on the most sensitive route (staff management).
  // Only acts once the JWT actually carries `user_role` — before the Auth
  // Hook is enabled the claim is simply absent, and we fall through to the
  // page-level `canManageStaff()` check rather than block everyone.
  if (user && pathname.startsWith("/admin/nhan-su")) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const claims = session ? decodeJwtClaims(session.access_token) : null;
    const role = typeof claims?.user_role === "string" ? claims.user_role : null;

    if (role && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
