"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useCartFavorites } from "../providers";

export default function SearchBox({ initialPage }) {
  const router = useRouter();
  const { addToCart, toggleFavorite, isFavorite } = useCartFavorites();
  const [term, setTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [page, setPage] = useState(initialPage.page);
  const [isPending, startTransition] = useTransition();
  const searchTerm = debouncedTerm.trim();
  const key = searchTerm
    ? `/api/dishes?q=${encodeURIComponent(searchTerm)}&page=${page}`
    : page > 1
      ? `/api/dishes?page=${page}`
      : null;
  const { data: swrData, error, isLoading } = useSWR(key, fetcher, {
    fallbackData: initialPage,
    keepPreviousData: true,
    revalidateOnFocus: false,
  });
  const data = key === null ? initialPage : swrData ?? initialPage;
  const queryError = key === null ? null : error;

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedTerm(term), 300);
    return () => clearTimeout(timeoutId);
  }, [term]);

  function goToPage(nextPage) {
    setPage(nextPage);
    const query = nextPage === 1 ? "" : `?page=${nextPage}`;
    startTransition(() => router.push(`/menu${query}`, { scroll: false }));
  }

  function handleSearchChange(event) {
    setTerm(event.target.value);
    if (page !== 1) {
      goToPage(1);
    }
  }

  return (
    <div>
      <label htmlFor="dish-search" className="mb-2 block font-semibold text-stone-800">
        Search dishes
      </label>
      <input
        id="dish-search"
        type="search"
        value={term}
        onChange={handleSearchChange}
        placeholder="Try kitfo or berbere"
        className="mb-6 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none transition focus:border-amber-600"
      />

      {queryError ? (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-800">
          We could not refresh the dishes. {queryError.message}
        </p>
      ) : null}
      {isLoading && !data ? (
        <p role="status" className="mb-4 text-stone-600">Loading dishes...</p>
      ) : null}
      {isPending ? <p className="sr-only" role="status">Changing page...</p> : null}

      {data.dishes.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-stone-600">
          No dishes match your search.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.dishes.map((dish, index) => (
            <article key={dish.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="relative">
                <Image
                  src={dish.image}
                  alt={dish.name}
                  width={640}
                  height={420}
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="h-48 w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  aria-label={isFavorite(dish.id) ? `Remove ${dish.name} from favorites` : `Add ${dish.name} to favorites`}
                  onClick={() => toggleFavorite(dish.id)}
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl shadow-sm transition hover:scale-105"
                >
                  {isFavorite(dish.id) ? "♥" : "♡"}
                </button>
              </div>
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                Signature dish
              </p>
              <h2 className="mt-3 text-2xl font-bold text-stone-900">{dish.name}</h2>
              <p className="mt-3 text-stone-600">{dish.description}</p>
              <div className="mt-5 flex items-center justify-between gap-2">
                <span className="text-xl font-black text-stone-900">{dish.price} ETB</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addToCart(dish)}
                    className="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
                  >
                    Add to cart
                  </button>
                  <Link
                    href={`/menu/${dish.id}`}
                    className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition hover:border-stone-500"
                  >
                    View dish
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {data.totalPages > 1 ? (
        <nav aria-label="Dish pages" className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1 || isPending}
            className="rounded-full border border-stone-300 px-5 py-2 font-semibold text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <p aria-live="polite" className="text-sm font-medium text-stone-600">
            Page {page} of {data.totalPages} · {data.total} dishes
          </p>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= data.totalPages || isPending}
            className="rounded-full border border-stone-300 px-5 py-2 font-semibold text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}
