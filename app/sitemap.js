import { getDishes } from "@/lib/dishes";
import { shareImage, siteUrl } from "./seo";

export default async function sitemap() {
  const lastModified = new Date();
  const dishes = await getDishes();

  return [
    {
      url: new URL("/", siteUrl).toString(),
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      images: [new URL(shareImage, siteUrl).toString()],
    },
    {
      url: new URL("/menu", siteUrl).toString(),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
      images: dishes.map((dish) => new URL(dish.image, siteUrl).toString()),
    },
    {
      url: new URL("/about", siteUrl).toString(),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...dishes.map((dish) => ({
      url: new URL(`/menu/${dish.id}`, siteUrl).toString(),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
      images: [new URL(dish.image, siteUrl).toString()],
    })),
  ];
}
