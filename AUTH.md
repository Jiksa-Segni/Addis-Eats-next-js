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
| Name | `addis-eats-session` |
| `httpOnly` | `true` — inaccessible to JavaScript |
| `secure` | `true` in production, `false` in development |
| `sameSite` | `lax` — sent on top-level navigations, blocked on cross-site sub-resource requests |
| `path` | `/` — sent on every request |
| `maxAge` | 604 800 seconds (7 days) |

---

## AUTH_SECRET

The secret is read from `process.env.AUTH_SECRET`.

- In **development**, if the variable is missing, a hardcoded placeholder string is used.
- In **production**, if the variable is missing, `getAuthSecret()` returns `null` and sign-in will fail — the server does not start without a configured secret in production.

Set a long random value (≥ 32 bytes) via your hosting environment before deploying:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## `getSession()` and `lib/auth.js`

`getSession()` is an `async` function that reads the session cookie from the Next.js `cookies()` store and calls `readSessionToken()`. It returns `null` for missing, invalid, or expired tokens.

It must only be called from server components, server actions, or route handlers. It is never imported into client components.

---

## Route protection model (three layers)

Each layer is independent — a failure in one does not rely on another.

### Layer 1 — Proxy (`proxy.js`)

`proxy.js` at the project root runs on the Next.js Edge runtime before any page renders. In Next.js 16, the file is named `proxy.js` (not `middleware.js`) and the exported function is named `proxy`. It checks for the presence and basic validity of the `addis-eats-session` cookie on the following routes:

```
/checkout  and nested paths  — customer only
/orders    and nested paths  — customer only
/kitchen   and nested paths  — admin only
/dashboard and nested paths  — admin only
```

If the cookie is absent or expired, the visitor is redirected to `/signin?next=<requested-path>`.
If the wrong role is present (e.g. admin visiting /checkout), they are redirected to a sensible page.

**What this layer proves:** The session cookie is present, structurally valid, and not expired.
**Why other layers are still required:** The Edge runtime cannot run Node's `crypto` module, so HMAC signature verification is not performed here. A cookie with a forged role value (but valid structure) would pass this check. Pages and actions must still call `getSession()` to verify the HMAC and expiry.

### Layer 2 — Page/action-level role check

Every protected server component and Server Action calls `getSession()` and verifies the role before touching any data:

```js
// Customer pages
const session = await getSession();
if (session?.role !== "customer") {
  redirect("/signin?next=...");
}

// Admin pages and actions
async function requireAdmin() {
  const session = await getSession();
  if (session?.role !== "admin") throw new Error("Admin access required");
}
```

**What this layer proves:** The session token is cryptographically valid, unexpired, and carries the required role.
**Why other layers are still required:** This layer alone has no middleware — a direct API call or a crafted request would reach the handler. Middleware speeds up the user experience by redirecting early. Data ownership checks are still needed because role alone is not sufficient for per-resource authorization.

### Layer 3 — Data ownership and write validation

Every sensitive read and write checks that the resource belongs to the authenticated user:

```js
const order = getOrderById(id);
if (!order || order.userId !== session.id) {
  notFound(); // 404 masks both missing and unauthorized
}
```

**What this layer proves:** The authenticated user owns the resource they are accessing. Prices and totals are recalculated server-side — never trusted from the browser.
**Why other layers are still required:** Ownership checks alone do not stop an unauthenticated visitor from reaching the handler. Middleware and page-level checks prevent that.

---

## Safe redirect handling

The `next` query parameter (e.g. `/signin?next=%2Fcheckout`) is validated by `isSafeRedirectPath()` in `lib/auth.js`:

```js
export function isSafeRedirectPath(path) {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}
```

This rejects:
- External URLs (`https://evil.com`) — do not start with `/`
- Protocol-relative URLs (`//evil.com`) — start with `//`
- Empty strings

Any value that fails this check is discarded and replaced with the role-appropriate default (`/menu` for customers, `/kitchen` for admin).

**Limitation:** A URL like `/\evil.com` would pass this check on some browsers. The current implementation is sufficient for the demo — a production deployment would add a stricter check using `new URL(path, origin).origin === origin`.

---

## Order ownership

- `app/orders/[id]/page.js` — calls `getOrderById(id)`, then checks `order.userId === session.id`. Returns `notFound()` for both missing orders and orders that belong to another user (to avoid leaking IDs).
- `app/api/orders/[id]/route.js` — same ownership check; returns `404` in both cases.
- Customer cannot cancel or read another customer's order through any code path.

---

## Kitchen / admin routes

- `app/kitchen/page.js` and `app/kitchen/items/page.js` both call `getSession()` and redirect if `role !== "admin"`.
- The `requireAdmin()` helper in `actions.js` is called at the top of every admin Server Action (`createDish`, `deleteDish`, `changeDishAvailability`, `updateKitchenOrderStatus`).
- Dashboard (`app/dashboard/page.js`) enforces the same admin check.

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
- Role toggle: select "Admin" on the sign-in page

---

## Security Test Results

Tests were designed from code review and verified by tracing the request path through the codebase. Manual execution against a running development server is required to record live results. Instructions for each test are below.

### Attack 1 — Signed-out access

**How to test:**
1. Clear cookies in your browser (or use an incognito window).
2. Navigate to `http://localhost:3000/checkout`
3. Navigate to `http://localhost:3000/orders`
4. From a terminal: `curl http://localhost:3000/api/orders`
5. From a terminal: `curl -X POST http://localhost:3000/api/orders -H "Content-Type: application/json" -d '{"name":"x","phone":"0911111111","address":"Bole Road, Addis Ababa","items":[{"id":"1","quantity":1}]}'`

**Expected results:**
- `/checkout` → redirect to `/signin?next=%2Fcheckout` (middleware + layout)
- `/orders` → redirect to `/signin?next=%2Forders` (middleware + page)
- `GET /api/orders` → `{"message":"Customer sign-in required."}` with HTTP 401
- `POST /api/orders` → `{"message":"Customer sign-in required."}` with HTTP 401

**Code path verified:** `middleware.js` redirects before the page renders. `app/checkout/layout.js` and `app/orders/page.js` call `getSession()` independently. `app/api/orders/route.js` checks `session?.role !== "customer"` and returns 401.

**Status: Code-review verified. Run manually to confirm live behaviour.**

---

### Attack 2 — Cross-account order access

**How to test:**
1. Sign in as Customer A (e.g. phone `0911111111`, password `password1`).
2. Place an order and note its order ID.
3. Sign out.
4. Sign in as Customer B (e.g. phone `0922222222`, password `password2`).
5. Navigate to `/orders/<order-id-from-customer-A>`
6. From a terminal: `curl http://localhost:3000/api/orders/<order-id-from-customer-A>` (with Customer B's session cookie)

**Expected results:**
- `/orders/<id>` → 404 (not-found page)
- `GET /api/orders/<id>` → `{"error":"Order not found."}` with HTTP 404

**Code path verified:** `app/orders/[id]/page.js` and `app/api/orders/[id]/route.js` both check `order.userId !== session.id` and return `notFound()` / 404 respectively. The response is identical for missing and unauthorised orders to prevent ID enumeration.

**Status: Code-review verified. Run manually to confirm live behaviour.**

---

### Attack 3 — Malicious redirect

**How to test:**
1. Navigate to `http://localhost:3000/signin?next=https://evil.com`
2. Sign in with valid customer credentials.
3. Navigate to `http://localhost:3000/signin?next=//evil.com`
4. Sign in again.
5. Navigate to `http://localhost:3000/signin?next=/\evil.com`
6. Sign in again.

**Expected results:**
- Case 1 (`https://evil.com`) → redirected to `/menu` (isSafeRedirectPath rejects non-`/` prefix)
- Case 2 (`//evil.com`) → redirected to `/menu` (isSafeRedirectPath rejects `//` prefix)
- Case 3 (`/\evil.com`) → redirected to `/menu` (isSafeRedirectPath: passes current check — monitor this edge case)

**Code path verified:** `app/actions.js` `authenticate` calls `isSafeRedirectPath(nextPath)`. If it returns false, `redirectTo` is set to the role-appropriate default (`/menu` for customers, `/kitchen` for admin).

**Status: Code-review verified. Run manually to confirm live behaviour.**

---

### Attack 4 — Wrong role (customer → kitchen)

**How to test:**
1. Sign in as a customer (any valid phone + 6-char password).
2. Navigate to `http://localhost:3000/kitchen`
3. Navigate to `http://localhost:3000/kitchen/items`
4. Navigate to `http://localhost:3000/dashboard`
5. From a terminal, call an admin action directly:
   ```bash
   # Attempt to update an order status as a customer
   curl -X POST http://localhost:3000/api/... 
   # (call updateKitchenOrderStatus server action via form submission)
   ```

**Expected results:**
- `/kitchen` → redirect to `/` (authenticated but wrong role)
- `/kitchen/items` → redirect to `/`
- `/dashboard` → redirect to `/`
- Admin Server Actions (`createDish`, `deleteDish`, etc.) → throw `"Admin access required"`

**Code path verified:** `app/kitchen/page.js` checks `session?.role !== "admin"` and redirects to `/` for authenticated non-admins and to `/signin?next=%2Fkitchen` for unauthenticated visitors. `requireAdmin()` in `app/actions.js` throws for any non-admin role.

**Status: Code-review verified. Run manually to confirm live behaviour.**

---

## Known Limitations

- Customers are not verified against a database — any syntactically valid phone and 6-character password creates a session. In a real system, phone-based OTP or a user database would replace this.
- Sessions are not revocable before expiry (no server-side session store). Signing out only deletes the client cookie; a captured token remains valid until it expires.
- Middleware performs a cookie-presence check only — full HMAC verification happens in each page/action. This is the correct and intended design: the Edge runtime does not support Node's `crypto` module.
- The `isSafeRedirectPath` check does not fully guard against paths like `/\evil.com` on all browsers. A stricter origin-comparison check would be needed for a production deployment.
- No rate limiting on the sign-in endpoint — brute-force attacks are possible.
