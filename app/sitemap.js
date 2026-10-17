/**
 * Task 23 — Sitemap.
 *
 * Generates canonical absolute URLs for every publicly indexable route.
 * Dish detail routes are produced dynamically from the real menu data so
 * the sitemap automatically reflects any dish additions or removals.
 *
 * Excluded routes (private / transactional / account-specific):
 *   /cart, /checkout, /orders, /signin, /kitchen, /api/*
 */
import { getDishes } from "@/lib/dishes";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export default async function sitemap() {
  const lastModified = new Date();

  // Static public routes
  const staticRoutes = [
    {
      url: new URL("/", siteUrl).toString(),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/menu", siteUrl).toString(),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: new URL("/about", siteUrl).toString(),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamic dish detail routes — only available (non-hidden) dishes are included.
  const dishes = await getDishes();
  const dishRoutes = dishes.map((dish) => ({
    url: new URL(`/menu/${dish.id}`, siteUrl).toString(),
    lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...dishRoutes];
}
