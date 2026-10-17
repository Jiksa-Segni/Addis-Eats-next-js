const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/menu", "/about"],
      disallow: ["/api/", "/cart", "/checkout", "/kitchen", "/orders", "/signin"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
