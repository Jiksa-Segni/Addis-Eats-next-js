"use client";

import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export default function OrderStatus({ id, initial }) {
  const { data, error } = useSWR(`/api/orders/${id}`, fetcher, {
    fallbackData: initial,
    refreshInterval: 5000,
    revalidateOnFocus: false,
  });

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Order tracking
        </p>
        <h1 className="mt-3 text-4xl font-black text-stone-900">Your order status</h1>

        {error ? (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-800">
            We could not refresh this order. {error.message}
          </p>
        ) : null}

        <div
          aria-live="polite"
          className="mt-8 rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200"
        >
          <p className="text-sm font-medium text-stone-600">Current status</p>
          <p className="mt-2 text-3xl font-bold capitalize text-amber-900">{data.status}</p>
          <p className="mt-4 text-sm text-stone-600">
            Order <span className="font-mono">{data.id}</span>
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Last updated:{" "}
            <time dateTime={data.updatedAt}>{data.updatedAt}</time>
          </p>
        </div>

        <p className="mt-5 text-sm text-stone-500">
          This status refreshes automatically every five seconds.
        </p>
        <Link
          href="/menu"
          className="mt-8 inline-block rounded-full bg-amber-700 px-5 py-3 font-semibold text-white transition hover:bg-amber-800"
        >
          Back to menu
        </Link>
      </div>
    </section>
  );
}
