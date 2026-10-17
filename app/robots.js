/**
 * Task 24 — Robots rules.
 *
 * Public pages (/, /menu, /menu/[id], /about) are allowed.
 * Private, transactional, and staff-only routes are disallowed so they do
 * not appear in search-engine indexes.
 *
 * IMPORTANT: robots rules are not an access-control mechanism. Every
 * protected route still enforces its own server-side authentication and
 * authorisation checks independently of this file.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/menu", "/about"],
      disallow: [
        "/api/",       // API routes — not human-readable pages
        "/cart",       // Transactional
        "/checkout",   // Transactional
        "/orders",     // Account-specific
        "/signin",     // Auth page
        "/kitchen",    // Staff-only
        "/dashboard",  // Staff analytics
      ],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
