"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { etb, when } from "@/lib/format";

const STATUS_BADGE = {
  received:   "bg-blue-50 text-blue-800",
  preparing:  "bg-amber-50 text-amber-800",
  ready:      "bg-green-50 text-green-800",
  on_the_way: "bg-purple-50 text-purple-800",
  delivered:  "bg-teal-50 text-teal-800",
  completed:  "bg-stone-100 text-stone-700",
  cancelled:  "bg-red-50 text-red-800",
};

export default function OrderTable({ orders, page, totalPages, sortBy, sortDir }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildUrl(updates) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function toggleSort(column) {
    const newDir = sortBy === column && sortDir === "desc" ? "asc" : "desc";
    router.push(buildUrl({ sortBy: column, sortDir: newDir, page: 1 }));
  }

  function goToPage(nextPage) {
    router.push(buildUrl({ page: nextPage }));
  }

  /** Accessible sort direction indicator */
  function SortIcon({ column }) {
    if (sortBy !== column) {
      return <span aria-hidden="true" className="ml-1 text-stone-400">↕</span>;
    }
    return (
      <span aria-hidden="true" className="ml-1 text-amber-700">
        {sortDir === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-stone-600 ring-1 ring-stone-200">
        <p>You have not placed any orders yet.</p>
        <Link href="/menu" className="mt-4 inline-block font-semibold text-amber-800 underline">
          Browse the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Your order history</caption>
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th scope="col" className="px-4 py-3">Order ID</th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("createdAt")}
                  className="flex items-center font-semibold hover:text-amber-700"
                  aria-label={`Sort by date ${sortBy === "createdAt" && sortDir === "desc" ? "ascending" : "descending"}`}
                >
                  Date <SortIcon column="createdAt" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleSort("status")}
                  className="flex items-center font-semibold hover:text-amber-700"
                  aria-label={`Sort by status ${sortBy === "status" && sortDir === "desc" ? "ascending" : "descending"}`}
                >
                  Status <SortIcon column="status" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3">Items</th>
              <th scope="col" className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort("total")}
                  className="ml-auto flex items-center font-semibold hover:text-amber-700"
                  aria-label={`Sort by total ${sortBy === "total" && sortDir === "desc" ? "ascending" : "descending"}`}
                >
                  Total <SortIcon column="total" />
                </button>
              </th>
              <th scope="col" className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 font-mono text-xs text-stone-600">
                  {order.id.slice(0, 8)}
                </td>
                <td className="px-4 py-3 text-stone-700">
                  <time dateTime={order.createdAt}>
                    {when(order.createdAt)}
                  </time>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      STATUS_BADGE[order.status] ?? "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-700">
                  {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                </td>
                <td className="px-4 py-3 text-right font-bold text-stone-900">
                  {etb(order.total)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/track/${order.id}`}
                    className="font-semibold text-amber-800 underline hover:text-amber-900"
                  >
                    Track
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
        <nav aria-label="Order pages" className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="rounded-full border border-stone-300 px-5 py-2 font-semibold text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <p aria-live="polite" className="text-sm font-medium text-stone-600">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="rounded-full border border-stone-300 px-5 py-2 font-semibold text-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}
