# PERF.md — Performance Notes

## Environment

- Framework: Next.js 16.4.0 (App Router)
- Runtime: Node.js on Windows (development), Vercel (target production)
- Build command: `npm run build`
- Start command: `npm run start`

---

## Lighthouse testing method

Lighthouse should be run against a **production build** (`npm run build && npm run start`), not the development server. The dev server has unoptimised bundles that skew scores significantly.

```
npm run build
npm run start
# Open http://localhost:3000 in Chrome DevTools → Lighthouse
# Device: Mobile emulation
# Throttling: Simulated 4x CPU slowdown, Fast 3G
```

> No Lighthouse scores are recorded in this document because no production build was run against a deployed environment at the time of writing. Fabricated numbers are not included. Run the above steps and record actual results here.

---

## Image optimisation

All images use the Next.js `<Image>` component (`next/image`), which provides:

- Automatic WebP/AVIF conversion.
- Lazy loading by default (`loading="lazy"`).
- `priority` prop set on above-the-fold images (home hero, dish detail header, first card on menu page with `index === 0`).
- Explicit `width` and `height` to prevent Cumulative Layout Shift (CLS).
- `sizes` attribute on menu grid cards: `"(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"` for correct responsive srcset.

### Image dimensions in use

| Location | width | height | priority |
|---|---|---|---|
| Home hero (featured dish) | 640 | 420 | yes |
| Menu card | 640 | 420 | first card only |
| Dish detail header | 960 | 600 | yes |

---

## Font optimisation

Google Fonts (Geist Sans, Geist Mono) are loaded via `next/font/google`, which:

- Downloads fonts at build time and self-hosts them (no third-party DNS lookup at runtime).
- Inlines the `@font-face` CSS in the `<head>` (no render-blocking stylesheet).
- Uses `font-display: swap` automatically.

---

## Third-party scripts

No third-party analytics or tracking scripts are loaded. No `<Script>` components with `strategy="beforeInteractive"` exist.

---

## Open Graph image generation

`app/opengraph-image.jsx` and `app/menu/[id]/opengraph-image.jsx` use `ImageResponse` from `next/og`. These are generated at build time for static routes and on-demand for dynamic routes. They do not depend on external image fetches, so they are build-environment-safe.

---

## Caching

- Menu listing page: `export const revalidate = 3600` (1-hour ISR). New dishes added by admin trigger `revalidatePath("/menu")` which invalidates the cache immediately.
- Dish detail pages: `export const dynamic = "force-dynamic"` (always fresh, avoids stale data after admin edits).
- Kitchen, orders, dashboard: all `force-dynamic`.

---

## Remaining work

- No Lighthouse scores recorded — must be run against a deployed production build.
- LCP, CLS, and INP values are unknown until measured.
- A `<link rel="preload">` for the hero image on the home page could be added if LCP is not meeting target.
- Bundle analysis (`@next/bundle-analyzer`) has not been run; Recharts adds ~80 kB (minified+gzip) to the dashboard chunk.
