import { NextResponse } from "next/server";

const SESSION_COOKIE = "addis-eats-session";

function readUnverifiedRole(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[0];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const session = JSON.parse(new TextDecoder().decode(bytes));
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

  if (path.startsWith("/checkout") && role !== "customer") {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/menu", request.url));
    }
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("next", path);
    return NextResponse.redirect(signInUrl);
  }

  if (path.startsWith("/kitchen") && role !== "admin") {
    if (role === "customer") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("next", path);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout/:path*", "/kitchen/:path*"],
};
