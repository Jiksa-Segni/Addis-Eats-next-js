# AUTH.md — Authentication and Authorisation Design

## Overview

Addis Eats uses a custom, stateless session system built on HMAC-signed cookies. There is no third-party auth library. All session logic lives in `lib/auth.js`.

---

## Roles

| Role | Description |
|---|---|
| `customer` | Any person who signs in with a valid Ethiopian phone number and a password of six or more characters. |
| `admin` | Restaurant staff. Credentials are configured via environment variables. |

---

## Sign-in flow

1. The user submits the `/signin` form (phone number, password, role selector).
2. The `authenticate` Server Action in `app/actions.js` runs on the server.
3. **Customer path** — the phone number is validated against the Ethiopian format (`09xxxxxxxx` or `+2519xxxxxxxxx`). Any valid phone and password ≥ 6 characters are accepted (demo mode — no database lookup).
4. **Admin path** — the phone and password are compared to `ADMIN_PHONE` and `ADMIN_PASSWORD` using `timingSafeEqual` from Node's `crypto` module to prevent timing attacks.
5. On success, `setSession()` creates a signed token and stores it in an `httpOnly` cookie.
6. The client component (`SignInForm.jsx`) receives `{ success: true, user, redirectTo }` and updates the React context via `signIn(user)`, then navigates to `redirectTo`.

## Sign-out flow

1. The user clicks "Sign out" in the NavBar.
2. `signOut()` (Server Action) calls `clearSession()`, which deletes the session cookie.
3. The client clears the user from React context and navigates to `/`.

---

## Session token

### Creation — `createSessionToken(user)`

```
payload  = base64url(JSON.stringify({ id, phone, name, role, expiresAt }))
token    = payload + "." + HMAC-SHA256(payload, AUTH_SECRET, base64url)
```

- `expiresAt` is set to `Date.now() + 7 days`.
- The token is a two-part dot-separated string. Any token with zero or more than two parts is rejected.

### Verification — `readSessionToken(token)`

1. Split on `.` — exactly two parts required.
2. Recompute the HMAC of the payload and compare with `timingSafeEqual`. Reject if they differ.
3. Decode and parse the payload JSON.
4. Validate field types: `id` and `phone` must be strings; `role` must be `"customer"` or `"admin"`.
5. Check `expiresAt > Date.now()`. Reject if expired.
6. Return the session object `{ id, phone, name, role }`.

### Cookie settings

| Attribute | Value |
|---|---|
| `httpOnly` | `true` — inaccessible to JavaScript |
| `secure` | `true` in production, `false` in development |
| `sameSite` | `lax` — sent on top-level navigations, blocked on cross-site sub-resource requests |
| `path` | `/` — sent on every request |
| `maxAge` | 604 800 seconds (7 days) |

---

## AUTH_SECRET

The secret is read from `process.env.AUTH_SECRET`.

- In **development**, if the variable is missing, a hardcoded placeholder string is used (logged as a warning).
- In **production**, if the variable is missing, `getAuthSecret()` throws an error immediately — the server will not start without a configured secret.

Set a long random value (≥ 32 bytes) via your hosting environment before deploying.

---

## `getSession()` and `lib/auth.js`

`getSession()` is an `async` function that reads the session cookie from the Next.js `cookies()` store and calls `readSessionToken()`. It returns `null` for missing, invalid, or expired tokens.

It must only be called from server components, server actions, or route handlers. It is never imported into client components.

---

## Route protection model (three layers)

Each layer is independent — a failure in one does not rely on another.

### Layer 1 — Layout-level redirect
Server layouts (e.g. `app/checkout/layout.js`) call `getSession()` and redirect unauthenticated users to `/signin?next=<path>` before any child component renders.

### Layer 2 — Page/action-level role check
Every protected server component and Server Action calls `getSession()` and verifies the role before touching any data:

```js
async function requireAdmin() {
  const session = await getSession();
  if (session?.role !== "admin") throw new Error("Admin access required");
}
```

### Layer 3 — API route authentication
Every protected API route handler calls `getSession()` and returns `401` for missing or invalid sessions before processing the request.

---

## Order ownership

- `app/orders/[id]/page.js` — calls `getOrderById(id)` (full record), then checks `order.userId === session.id`. Returns `notFound()` for both missing orders and orders that belong to another user (to avoid leaking IDs).
- `app/api/orders/[id]/route.js` — same ownership check; returns `404` in both cases.
- Customer cannot cancel or read another customer's order through any code path.

---

## Kitchen / admin routes

- `app/kitchen/page.js` and `app/kitchen/items/page.js` both call `getSession()` and redirect if `role !== "admin"`.
- The `requireAdmin()` helper in `actions.js` is called at the top of every admin Server Action (`createDish`, `deleteDish`, `changeDishAvailability`, `updateKitchenOrderStatus`).
- Dashboard (`app/dashboard/page.js`) enforces the same admin check.

---

## Safe redirect handling

The `next` query parameter (e.g. `/signin?next=%2Fcheckout`) is validated by `isSafeRedirectPath()`:

```js
path.startsWith("/") && !path.startsWith("//")
```

This prevents open-redirect attacks where an attacker supplies an external URL. Any value that fails this check is discarded and replaced with the role-appropriate default (`/menu` for customers, `/kitchen` for admin).

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | Yes (production) | Long random secret for HMAC signing. |
| `ADMIN_PHONE` | Yes | Admin phone number in Ethiopian format. |
| `ADMIN_PASSWORD` | Yes | Admin password (minimum 6 characters recommended). |
| `ADMIN_NAME` | No | Display name shown in the nav bar (default: "Admin"). |

---

## Demo sign-in accounts

**Customer** — any valid Ethiopian phone number and any password of 6+ characters. Example:
- Phone: `0912345678`
- Password: `password123`

**Admin** — use the values you set in `.env.local`:
- Phone: value of `ADMIN_PHONE`
- Password: value of `ADMIN_PASSWORD`

---

## Security test scenarios

| Test | Expected result |
|---|---|
| Access `/kitchen` while signed out | Redirect to `/signin?next=%2Fkitchen` |
| Access `/kitchen` signed in as customer | Redirect to `/` |
| Sign in with wrong admin password | Error message; no session created |
| Craft `?next=https://evil.com` | Redirect ignored; goes to `/kitchen` |
| Request `/api/orders/<other-user-id>` as a different customer | `404 Not found` |
| Access `/orders/<id>` for another customer's order | `notFound()` — 404 page |

> These tests were designed from code review. Manual execution should be performed against a running development server and results recorded here.

---

## Known limitations

- Customers are not verified against a database — any syntactically valid phone and 6-character password creates a session. In a real system, phone-based OTP or a user database would replace this.
- Sessions are not revocable before expiry (no server-side session store). Signing out only deletes the client cookie; a captured token remains valid until it expires.
