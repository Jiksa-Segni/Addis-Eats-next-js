import { siteUrl } from "./seo";

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
