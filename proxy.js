/**
 * proxy.js — Route protection (Layer 1 of 3).
 *
 * Next.js 16 uses proxy.js (not middleware.js) for edge-runtime route
 * interception. The exported function must be named `proxy` and the export
 * must be named `config` with a `matcher` array.
 * Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
 *
 * PROTECTED ROUTES
 * ─────────────────
 * /checkout  — customer only
 * /orders    — customer only
 * /kitchen   — admin only
 * /dashboard — admin only
 *
 * SESSION TOKEN DECODING
 * ───────────────────────
 * The Edge runtime does not support Node's `crypto` module, so full HMAC
 * verification cannot be performed here. Instead, the payload is decoded
 * from base64url and the `role` and `expiresAt` fields are read without
 * signature verification.
 *
 * This is intentionally lightweight. The role read here is UNTRUSTED for
 * security decisions — it is used only to choose the correct redirect
 * destination (e.g. admins are redirected to /menu instead of /signin
 * when they try to access /checkout). Full cryptographic verification
 * happens in every protected page, server action, and API handler via
 * getSession() (Layer 2 and 3).
 *
 * WHAT THIS LAYER PROVES
 * ───────────────────────
 * The session cookie is present and contains an unexpired payload.
 * It does NOT prove the payload is untampered — that requires the HMAC
 * check in getSession() (server-side only).
 *
 * WHY OTHER LAYERS ARE STILL REQUIRED
 * ─────────────────────────────────────
 * A crafted cookie could pass this check with a forged role value.
 * Pages, actions, and API handlers must always call getSession() to
 * perform the full HMAC + role verification (Layer 2).
 */

import { NextResponse } from "next/server";

/** Must match SESSION_COOKIE in lib/auth.js */
const SESSION_COOKIE = "addis-eats-session";

/**
 * Decode the session payload WITHOUT verifying the HMAC signature.
 * Returns the role string if the token is structurally valid and not expired,
 * or null otherwise.
 *
 * This is safe to use for redirect routing decisions only.
 * Never use this to grant access to data.
 */
function readUnverifiedRole(token) {
  if (!token) return null;

  try {
    const payload = token.split(".")[0];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const session = JSON.parse(new TextDecoder().decode(bytes));

    // Check expiry even in the unverified path to avoid redirecting expired sessions
    return typeof session.expiresAt === "number" && session.expiresAt > Date.now()
      ? session.role
      : null;
  } catch {
    return null;
  }
}

export function proxy(request) {
  const path = request.nextUrl.pathname;
  const role = readUnverifiedRole(request.cookies.get(SESSION_COOKIE)?.value);

  // ── /checkout — customer only ────────────────────────────────────────────
  if (path.startsWith("/checkout")) {
    if (role === "customer") return NextResponse.next();
    if (role === "admin") {
      // Admin is authenticated but not a customer — send to menu
      return NextResponse.redirect(new URL("/menu", request.url));
    }
    // Not signed in — redirect to /signin preserving destination
    const url = new URL("/signin", request.url);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // ── /orders — customer only ──────────────────────────────────────────────
  if (path.startsWith("/orders")) {
    if (role === "customer") return NextResponse.next();
    if (role === "admin") {
      return NextResponse.redirect(new URL("/kitchen", request.url));
    }
    const url = new URL("/signin", request.url);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // ── /kitchen — admin only ────────────────────────────────────────────────
  if (path.startsWith("/kitchen")) {
    if (role === "admin") return NextResponse.next();
    if (role === "customer") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const url = new URL("/signin", request.url);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // ── /dashboard — admin only ──────────────────────────────────────────────
  if (path.startsWith("/dashboard")) {
    if (role === "admin") return NextResponse.next();
    if (role === "customer") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const url = new URL("/signin", request.url);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Narrow matcher — only routes that require authentication.
 * Excludes /signin to prevent redirect loops.
 * Excludes /_next, /api, /images, and all other public routes.
 */
export const config = {
  matcher: [
    "/checkout",
    "/checkout/:path*",
    "/orders",
    "/orders/:path*",
    "/kitchen",
    "/kitchen/:path*",
    "/dashboard",
    "/dashboard/:path*",
  ],
};
