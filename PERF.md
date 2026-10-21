# PERF.md — Performance Optimisation

## Testing Method

Lighthouse measurements must be taken against a **production build** (`npm run build && npm run start`), not the development server. The dev server uses Turbopack without minification and produces artificially low scores.

### How to Run Lighthouse

```bash
# Build and start production server
npm run build
npm run start

# Option A — Chrome DevTools
# Open http://localhost:3000 in Chrome
# DevTools → Lighthouse → Mode: Navigation → Device: Desktop → Analyse page load

# Option B — CLI
npm install -g lighthouse
lighthouse http://localhost:3000 --preset=desktop --view
lighthouse http://localhost:3000/menu --preset=desktop --view
```

### Test Conditions (standardise these for repeatable results)

| Setting | Value |
|---|---|
| Device emulation | Desktop (1350×940, no throttle) |
| Network throttling | None (localhost) |
| CPU throttling | None |
| Build | Production (`npm run build`) |
| Date | Record the date when you run the test |

---

## Baseline Measurements (Before Optimisations)

> Lighthouse measurements require a running browser. This project is developed on Windows without a headless browser available in the automated build environment.
>
> **To collect baseline values:** Run `npm run build && npm run start`, then open Chrome DevTools → Lighthouse on `http://localhost:3000` and `http://localhost:3000/menu`. Record the scores in the table below before making any optimisation changes.

| Metric | Route | Before | After | Difference | Notes |
|---|---|---|---|---|---|
| Performance score | `/` | — | — | — | Run Lighthouse to fill |
| LCP | `/` | — | — | — | Run Lighthouse to fill |
| CLS | `/` | — | — | — | Run Lighthouse to fill |
| INP | `/` | — | — | — | Run Lighthouse to fill |
| Performance score | `/menu` | — | — | — | Run Lighthouse to fill |
| LCP | `/menu` | — | — | — | Run Lighthouse to fill |
| CLS | `/menu` | — | — | — | Run Lighthouse to fill |
| INP | `/menu` | — | — | — | Run Lighthouse to fill |

---

## Optimisations Applied

### 1. Image Optimisation (§12) — Already implemented

All images in the application use Next.js `next/image` (`Image` component):

- **`app/page.js`** — Featured dish image uses `priority` (above-the-fold LCP candidate), `width={640}`, `height={420}`, meaningful `alt` text.
- **`app/menu/SearchBox.jsx`** — Dish grid images use `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"`, `priority={index === 0}` on the first card only, `width={640}`, `height={420}`.
- **`app/menu/[id]/page.js`** — Dish detail hero uses `priority`, `width={960}`, `height={600}`.

**Impact:** Eliminates layout shift from unsized images (reduces CLS). Automatic format conversion to WebP/AVIF reduces transfer size. Lazy loading for below-fold images reduces LCP.

### 2. Font Optimisation (§13) — Already implemented

Fonts are loaded via `next/font/google` in `app/layout.js`:

```js
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",       // prevents FOIT — text is visible during font load
  fallback: ["system-ui", "arial"],
});
```

**Change made:** Added `display: "swap"` and `fallback` arrays to both `geistSans` and `geistMono`. This was missing from the original configuration.

**Impact:** `display: swap` prevents invisible text during font load (removes FOIT). Fallback fonts keep layout stable, reducing CLS. Next.js automatically self-hosts the font files and sets long-lived cache headers.

### 3. Third-party Scripts (§14)

No third-party scripts (analytics, ads, tracking) are included in this project. There are no manually inserted `<script>` tags that need to be migrated to `next/script`.

The only external resource at runtime is:
- **OpenStreetMap tiles** in `DeliveryMap.jsx` — loaded by Leaflet via `<img>` tags it manages internally. These are lazy-loaded by Leaflet and do not appear in the initial page load critical path.
- **Leaflet marker icons** from `unpkg.com` — small PNG files loaded after the Leaflet chunk, not blocking.

**No changes required for third-party scripts.**

### 4. OG Image Generation (§20, §21) — Verified

`app/opengraph-image.jsx` and `app/menu/[id]/opengraph-image.jsx` use `ImageResponse` from `next/og`. These generate 1200×630 PNG images at build time with no external dependencies.

**Social sharing:** For Telegram, WhatsApp, and other crawlers to display the preview image, `NEXT_PUBLIC_SITE_URL` must be set to the public production domain. With `metadataBase` set to this URL, all relative `/opengraph-image.png` paths become absolute in the rendered `<meta>` tags.

---

## Remaining Measurements

The before/after Lighthouse table above requires manual execution. Steps:

1. `npm run build`
2. `npm run start`
3. Open Chrome, navigate to `http://localhost:3000`
4. DevTools → Lighthouse → Desktop → Analyse
5. Record: Performance score, LCP, CLS, INP
6. Repeat for `http://localhost:3000/menu`
7. Fill in the "Before" column in the table above
8. The "After" column applies the same measurement after any further optimisations
9. The existing codebase already applies all optimisations listed above, so Before ≈ After for this project state
