import { redirect } from "next/navigation";
import SearchBox from "./SearchBox";
import { getDishesPage } from "@/lib/dishes";
import { createPageMetadata, jsonLd, siteUrl } from "../seo";

export const metadata = createPageMetadata({
  title: "Ethiopian Restaurant Menu",
  description:
    "Browse the Addis Eats menu of Ethiopian favorites, including Doro Wet, Kitfo, Shiro, Tibs, fresh juices, and more.",
  path: "/menu",
});

export const revalidate = 3600;

export default async function MenuPage({ searchParams }) {
  const { page: pageParam } = await searchParams;
  const requestedPage = pageParam === undefined ? 1 : Number(pageParam);

  if (!Number.isSafeInteger(requestedPage) || requestedPage < 1) {
    redirect("/menu");
  }

  const initialPage = await getDishesPage({ page: requestedPage });
  if (requestedPage > initialPage.totalPages) {
    redirect(initialPage.totalPages === 1 ? "/menu" : `/menu?page=${initialPage.totalPages}`);
  }

  const menuSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Addis Eats Ethiopian Restaurant Menu",
    url: new URL("/menu", siteUrl).toString(),
    numberOfItems: initialPage.total,
    itemListElement: initialPage.dishes.map((dish, index) => ({
      "@type": "ListItem",
      position: (initialPage.page - 1) * initialPage.pageSize + index + 1,
      item: {
        "@type": "MenuItem",
        name: dish.name,
        description: dish.description,
        image: new URL(dish.image, siteUrl).toString(),
        offers: {
          "@type": "Offer",
          price: dish.price,
          priceCurrency: "ETB",
          availability: "https://schema.org/InStock",
        },
      },
    })),
  };

  return (
    <div className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(menuSchema)} />
      <div className="rounded-3xl bg-stone-900 px-6 py-8 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Today&apos;s menu</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">Our Ethiopian Menu</h1>
        <p className="mt-3 max-w-2xl text-stone-200">
          Explore our most loved dishes, prepared fresh and served with generous Ethiopian hospitality.
        </p>
      </div>

      <SearchBox key={initialPage.page} initialPage={initialPage} />
    </div>
  );
}
