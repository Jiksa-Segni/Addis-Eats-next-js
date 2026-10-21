# Addis Eats

A full-featured Ethiopian restaurant ordering platform built with **Next.js  App Router**, React 19, Tailwind CSS 4, and a custom HMAC-signed session authentication system.

---

## Overview

Addis Eats lets customers browse an Ethiopian menu, add dishes to a cart, place delivery orders, and track their order in real time on an animated Leaflet map. Restaurant staff log in to a separate kitchen dashboard to advance orders through the kitchen workflow and manage menu items.

### Main Features

- **Menu** — paginated dish listing with debounced live search
- **Cart & Favourites** — persistent via localStorage, cross-tab sync
- **Checkout** — server-validated order placement with Zod schemas
- **Live order tracking** — SWR polling + SVG map on `/orders/[id]`, Leaflet map + SSE stream on `/track/[id]`
- **Order history** — sortable, paginated table with CSV export
- **Kitchen dashboard** — staff-only order workflow management
- **Admin item management** — add, enable/disable, and remove menu items
- **Revenue dashboard** — Recharts bar + line charts with accessible data tables
- **SEO** — full Open Graph metadata, per-dish OG images, JSON-LD structured data, sitemap, robots.txt
- **Social sharing** — 1200×630 OG images generated at build time; works on Telegram, WhatsApp, Twitter/X, Facebook, LinkedIn

---

## Technologies

| Package | Version | Purpose |
|---|---|---|
| next | 16.4.0 | App Router framework |
| react | 19.3.0 | UI library |
| react-dom | 19.3.0 | DOM renderer |
| tailwindcss | ^4 | Utility-first CSS |
| swr | ^2.5.1 | Client-side data fetching and polling |
| zod | ^4.6.5 | Server-side schema validation |
| recharts | ^3.1.0 | Revenue bar and line charts |
| leaflet | 1.9.4 | Interactive delivery map |

No database is used. All data is stored in in-memory Maps on `globalThis` and is reset on server restart. This is intentional for a classroom/demo context.

---

## Requirements

- Node.js 18.17 or later (Node 20+ recommended)
- npm 9+ (or compatible package manager)

---

## Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd Addis-Eats-next-js

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and fill in the required values (see below)
```

---

## Environment Setup

Copy `.env.example` to `.env.local` and provide real values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | Yes (production) | Long random string for HMAC session signing. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_PHONE` | Yes | Staff account phone number in Ethiopian format (`09xxxxxxxx`) |
| `ADMIN_PASSWORD` | Yes | Staff account password (minimum 6 characters) |
| `ADMIN_NAME` | No | Display name shown in the nav bar for admin (default: "Admin") |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical public URL, e.g. `https://addis-eats.vercel.app`. Required for correct OG image URLs and sitemaps in production. |

> **Important:** In development, if `AUTH_SECRET` is not set, a hardcoded fallback is used (insecure but functional). In production, the server will refuse to start without `AUTH_SECRET`.

---

## Local Development

```bash
npm run dev
```

The app runs at `http://localhost:3000` by default.

---

## Production Build and Start

```bash
npm run build
npm run start
```

---

## Available Routes

| Route | Description |
|---|---|
| `/` | Home page with featured dish and contact info |
| `/menu` | Paginated dish listing with live search |
| `/menu/[id]` | Individual dish detail with JSON-LD structured data |
| `/about` | Restaurant story page |
| `/cart` | Shopping cart (localStorage) |
| `/checkout` | Order placement form (requires customer sign-in) |
| `/orders` | Customer order history — sortable, paginated (requires sign-in) |
| `/orders/[id]` | Live order status with SWR polling and SVG delivery map |
| `/track/[id]` | Live delivery tracking with SSE stream and Leaflet map |
| `/signin` | Sign-in page (customer and admin) |
| `/kitchen` | Staff order management dashboard (admin only) |
| `/kitchen/items` | Menu item management — add, toggle, remove (admin only) |
| `/dashboard` | Revenue and order analytics (admin only) |

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/dishes` | None | All available dishes, or paginated + filtered by `?q=&page=` |
| GET | `/api/dishes/[id]` | None | Single available dish |
| GET | `/api/dishes/report` | Admin | CSV export of all dishes |
| GET | `/api/orders` | Customer | Authenticated customer's own orders |
| POST | `/api/orders` | Customer | Create an order via JSON body |
| GET | `/api/orders/[id]` | Customer | Single order status (ownership enforced) |
| GET | `/api/orders/[id]/stream` | Customer | SSE live status stream |
| GET | `/api/orders/export` | Customer | CSV export of customer order history |

---

## Authentication

### Customer sign-in
Any valid Ethiopian phone number (`09xxxxxxxx` or `+2519xxxxxxxx`) and a password of 6+ characters creates a customer session. No database lookup is performed — this is demo mode.

```
Phone:    0912345678   (any valid Ethiopian number)
Password: password123  (any 6+ character password)
```

### Admin / Staff sign-in
Use the values you set in `.env.local`:
- Phone: value of `ADMIN_PHONE`
- Password: value of `ADMIN_PASSWORD`

Select "Admin" on the sign-in page before submitting.

---

## Data Storage

All data is stored in-memory using `globalThis` Maps:

- `globalThis.__addisEatsMenu` — dish catalogue (12 seed dishes on first load)
- `globalThis.__addisEatsOrders` — customer orders

**Data is lost on every server restart.** Orders and dishes are not persisted to a database. This is intentional for a classroom/demo context.

---

## Security Testing

See [AUTH.md](./AUTH.md) for full documentation and test results.

Quick manual tests:
1. **Signed out:** Visit `http://localhost:3000/checkout` — should redirect to `/signin?next=%2Fcheckout` (proxy.js + layout)
2. **Signed out:** Visit `http://localhost:3000/orders` — should redirect to `/signin?next=%2Forders`
3. **Cross-account:** Sign in as customer A, then visit `/orders/[order-id-from-customer-B]` — should return 404
4. **Open redirect:** Visit `/signin?next=https://evil.com` — after sign-in should redirect to `/menu`, not the external URL
5. **Customer → kitchen:** Sign in as customer, visit `/kitchen` — should redirect to `/`

---

## Running Lighthouse

```bash
# 1. Build and start production server
npm run build
npm run start

# 2. Open Chrome DevTools → Lighthouse tab
#    OR use CLI:
npm install -g lighthouse
lighthouse http://localhost:3000 --view --preset=desktop
lighthouse http://localhost:3000/menu --view --preset=desktop
```

See [PERF.md](./PERF.md) for baseline and post-optimisation measurements.

---

## Social Sharing / Open Graph Images

When shared on Telegram, WhatsApp, Twitter/X, Facebook, or LinkedIn:

- **Home page** (`/`) — uses `/opengraph-image.png` (1200×630, dark branding)
- **Menu page** (`/menu`) — uses the site-wide OG image
- **Each dish** (`/menu/[id]`) — uses a per-dish generated image with dish name, description, and price

For OG images to work correctly in production, `NEXT_PUBLIC_SITE_URL` must be set to your real deployed URL (e.g. `https://addis-eats.vercel.app`). Without it, the image URLs will be relative and social media crawlers cannot fetch them.

---

## Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel
```

Set these environment variables in the Vercel project settings:
- `AUTH_SECRET` — long random secret
- `ADMIN_PHONE` — admin phone number
- `ADMIN_PASSWORD` — admin password
- `ADMIN_NAME` — admin display name (optional)
- `NEXT_PUBLIC_SITE_URL` — your Vercel deployment URL (e.g. `https://addis-eats.vercel.app`)

> **Deployed URL:** Not yet deployed. Set `NEXT_PUBLIC_SITE_URL` once you have a production domain.

---

## Documentation

- [AUTH.md](./AUTH.md) — Authentication design, security model, and attack test results
- [DATA.md](./DATA.md) — Data layer, query flows, SWR patterns, and API validation
- [PERF.md](./PERF.md) — Lighthouse performance measurements and optimisation changes

---

## Known Limitations

- In-memory data is lost on server restart (no database)
- Customer authentication accepts any valid phone format + 6-char password (demo mode, no OTP)
- Sessions are not revocable before 7-day expiry (no server-side session store)
- No rate limiting on the sign-in endpoint
- No email/SMS order notifications
- Image upload is not supported — dish images must be placed in `/public/images/`
