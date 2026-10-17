import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "addis-eats-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getAuthSecret() {
  const secret =
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "production"
      ? ""
      : "addis-eats-day-45-local-development-only-secret");

  if (!secret) {
    throw new Error("AUTH_SECRET must be configured before using authentication.");
  }

  return secret;
}

function sign(payload) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function normalizePhone(phone) {
  const normalized = phone.trim().replace(/[\s()-]/g, "");
  return normalized.startsWith("09") ? `+251${normalized.slice(1)}` : normalized;
}

export function isSafeRedirectPath(path) {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

export function createSessionToken(user) {
  const payload = Buffer.from(
    JSON.stringify({
      ...user,
      expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
    })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token) {
  if (typeof token !== "string") {
    return null;
  }

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) {
    return null;
  }

  if (!safeEqual(signature, sign(payload))) {
    return null;
  }

  let session;
  try {
    session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    !session ||
    typeof session.id !== "string" ||
    typeof session.phone !== "string" ||
    !["customer", "admin"].includes(session.role) ||
    typeof session.expiresAt !== "number" ||
    session.expiresAt <= Date.now()
  ) {
    return null;
  }

  return {
    id: session.id,
    phone: session.phone,
    name: typeof session.name === "string" ? session.name : session.phone,
    role: session.role,
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function setSession(user) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function isAdminCredential(phone, password) {
  const configuredPhone = process.env.ADMIN_PHONE;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  return Boolean(
    configuredPhone &&
      configuredPassword &&
      safeEqual(normalizePhone(phone), normalizePhone(configuredPhone)) &&
      safeEqual(password, configuredPassword)
  );
}
