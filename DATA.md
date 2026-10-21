# DATA.md — Data Layer and Query Documentation

## Storage model

All data is stored in in-memory `Map` objects attached to `globalThis`:

| Global key | Module | Purpose |
|---|---|---|
| `globalThis.__addisEatsMenu` | `lib/dishes.js` | Dish catalogue |
| `globalThis.__addisEatsOrders` | `lib/orders.js` | Customer orders |

Data is seeded at module-load time and survives Next.js hot-reloads (because `globalThis` is shared). It is **lost on server restart** — this is an intentional limitation for a classroom exercise.

---

## Dish queries

### `getDishes()`
- Returns all dishes where `isAvailable === true`.
- Used by: `app/page.js` (home hero), `app/sitemap.js`.
- Server-only. No SWR key.
- Refreshes: on `revalidatePath` calls from admin Server Actions.

### `getDishesPage({ query, page })`
- Filters available dishes by a search term, then paginates at 4 items per page.
- Used by: `app/menu/page.js` (initial SSR), `app/api/dishes/route.js` (client SWR polling).
- **Initial load**: server component passes `initialPage` as `fallbackData` to `SearchBox`.
- **Client refresh**: `SearchBox.jsx` uses SWR with key `/api/dishes?q=<term>&page=<n>`.
- Debounce: 300 ms on keystroke before updating the SWR key.
- `keepPreviousData: true` so the previous page stays visible while the next loads.
- Loading state: spinner shown when `isLoading && !data`.
- Empty state: "No dishes match your search."
- Error state: `role="alert"` banner showing the error message.

### `getDishById(id)`
- Returns a single available dish or `null`.
- Used by: `app/menu/[id]/page.js`, `lib/orders.js` (`resolveOrderItems`), `app/api/dishes/[id]/route.js`.
- Only returns dishes where `isAvailable === true` — unavailable dishes are treated as missing.

### `getAllDishes()`
- Returns all dishes regardless of availability.
- Used by admin only: `app/api/dishes/report/route.js` (CSV export), `app/kitchen/items/page.js`.

---

## Order queries

### `saveOrder(order)`
- Writes a new order to the in-memory store.
- Called by: `placeOrder` Server Action, `POST /api/orders`.
- Price and total are **always recalculated server-side** from `resolveOrderItems()`. The browser-submitted price is never trusted.

### `resolveOrderItems(items)`
- Looks up each item by ID, verifies availability, and calculates `price × quantity` totals.
- Returns `null` if any item is unavailable — the caller returns an error to the user.

### `getOrdersByUserId(userId)`
- Returns orders belonging to a specific user, sorted by `createdAt` descending.
- Used by: `app/orders/page.js` (customer order history), `GET /api/orders`, `GET /api/orders/export`.
- Authentication: caller must verify `session.id` before passing `userId`.

### `getOrderById(id)`
- Returns the full internal order record.
- Used by: `app/orders/[id]/page.js` (ownership check), Server Actions (`cancelOrder`, `updateKitchenOrderStatus`), `GET /api/orders/[id]`.
- Callers must check `order.userId === session.id` before returning data to customers.

### `getOrders()`
- Returns all orders. Used by admin only: `app/kitchen/page.js`, `app/dashboard/page.js`.

---

## Order status polling (§26)

- **Endpoint**: `GET /api/orders/[id]`
- **Authentication**: requires a valid customer session; returns `401` otherwise.
- **Ownership**: returns `404` for orders that do not belong to the requesting customer.
- **Client component**: `app/orders/[id]/OrderStatus.js`
- **SWR key**: `/api/orders/<id>`
- **Polling interval**: 3 000 ms during `preparing`, 2 000 ms during `on_the_way`, 5 000 ms otherwise. Set to `0` when status is `"completed"`, `"delivered"`, or `"cancelled"` (terminal).
- **Initial data**: the server component (`app/orders/[id]/page.js`) passes `publicOrder` as `fallbackData` so the page is meaningful before the first poll resolves.
- **Error state**: `role="alert"` banner with the error message.
- **`aria-live="polite"`** on the status region so screen readers announce status changes.

---

## SSE live stream (alternative to polling on `/track/[id]`)

- **Endpoint**: `GET /api/orders/[id]/stream`
- **Authentication**: customer session + ownership enforced before stream opens.
- **Client component**: `app/track/[id]/TrackPage.jsx` via native `EventSource` API.
- **Events**: `status` (update), `done` (terminal — client closes connection), `error`.
- **Leaflet map**: loaded with `dynamic(() => import("./DeliveryMap"), { ssr: false })` to prevent server-side import of `leaflet` (which accesses `window`).
- **Connection indicator**: coloured dot (connecting / live / error / closed).

---

## Debounced menu search (§27)

- **Component**: `app/menu/SearchBox.jsx`
- **Debounce**: 300 ms via `setTimeout` / `clearTimeout` in a `useEffect`.
- **SWR key**: `null` when the search term is empty and page is 1 (uses `initialPage` without a network request).
- **`keepPreviousData: true`**: previous results stay visible during a new fetch.
- **`revalidateOnFocus: false`**: prevents re-fetching when the user tabs back to the window.
- Empty state: "No dishes match your search."
- Error state: `role="alert"` banner.

---

## Paged dish listing (§28)

- Page is stored in the URL query parameter `?page=N`.
- `app/menu/page.js` reads `searchParams.page`, validates it (`Number.isSafeInteger`, ≥ 1), and redirects out-of-range values.
- The client `SearchBox` mirrors the page in the URL via `router.push` inside `startTransition` (no full navigation flash).
- `aria-live="polite"` on the pagination status paragraph.

---

## Dashboard aggregation (§30)

- **Component**: `app/dashboard/page.js` (server component).
- **Data source**: `getOrders()` — all orders.
- **Revenue calculation**: sum of `order.total` where `order.status === "completed"`.
- **Orders over time**: count per day (`order.createdAt.slice(0, 10)`), excluding cancelled.
- **Neighbourhood**: extracted from `order.address` (the first segment before the comma).
- No SWR involved — fully server-rendered on each request (`force-dynamic`).
- Empty state: message shown when no completed orders exist.

---

## Order table (§32)

- **Server component** (`app/orders/page.js`): authenticates, fetches, sorts, paginates.
- **Client component** (`app/orders/OrderTable.jsx`): renders the table, handles sort/page URL updates.
- Sort field validated against `Set(["createdAt", "total", "status"])`.
- Sort direction validated against `Set(["asc", "desc"])`.
- Page clamped to `[1, totalPages]`.
- Page size: 10 orders per page.
- Pagination reflected in URL (`?page=N&sortBy=X&sortDir=Y`) for browser back/forward compatibility.

---

## API validation

All API routes validate incoming data using Zod (`lib/schema.js`):

- `POST /api/orders` — validates `orderSchema` (name, phone, address, notes, items with quantity 1–20).
- `GET /api/dishes` — validates `page` (positive safe integer) and `q` (max 100 chars).
- Sort parameters for the order table are validated server-side against an explicit allowlist.

Prices and totals are **never trusted from the browser**. `resolveOrderItems()` always recalculates from the server's dish store.

---

## Authentication and session

All authentication uses `lib/auth.js`:

- `getSession()` — reads and verifies the HMAC-signed session cookie. Returns `null` if missing, malformed, expired, or tampered.
- `setSession(user)` — creates a signed token and writes the `httpOnly` cookie.
- `clearSession()` — deletes the session cookie.

The session user object passed across server/client boundaries is the `initialUser` prop on `<Providers>`, set from `getSession()` in `app/layout.js`. Client components never call `getSession()` directly.

---

## Route protection layers

1. **Proxy** (`proxy.js`) — presence + expiry check at the Edge, redirects to `/signin` for `/checkout`, `/orders`, `/kitchen`, `/dashboard` routes. In Next.js 16, the proxy file replaces middleware.js.
2. **Page/action level** — full HMAC + role verification via `getSession()` in every protected server component and Server Action.
3. **Data ownership** — per-resource ownership check (`order.userId === session.id`) on every read and write.

See [AUTH.md](./AUTH.md) for the full three-layer security model documentation.
