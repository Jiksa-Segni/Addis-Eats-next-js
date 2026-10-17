import { redirect } from "next/navigation";
import SearchBox from "./SearchBox";
import { getDishesPage } from "@/lib/dishes";

export const metadata = {
  title: "Ethiopian Restaurant Menu",
  description:
    "Browse the full Addis Eats menu — Doro Wet, Kitfo, Shiro, Tibs, fresh juices, coffee, and more. Filter, search, and add dishes to your cart.",
  openGraph: {
    title: "Addis Eats Menu — Ethiopian Food",
    description:
      "Explore every dish on the Addis Eats menu and order your favourites for delivery in Addis Ababa.",
  },
};

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

  return (
    <div className="space-y-6">
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
