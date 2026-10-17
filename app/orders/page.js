/**
 * Task 32 — Order history page with server-side sorting and pagination.
 *
 * Sort field and direction are validated against an explicit allowlist on
 * the server. Out-of-range or malformed page values are clamped silently.
 * Authentication and ownership are enforced here before any data is passed
 * to the client table component.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOrdersByUserId } from "@/lib/orders";
import OrderTable from "./OrderTable";

export const dynamic = "force-dynamic";

/** Columns the user is permitted to sort by — validated server-side. */
const ALLOWED_SORT_FIELDS = new Set(["createdAt", "total", "status"]);
const ALLOWED_SORT_DIRS   = new Set(["asc", "desc"]);
const PAGE_SIZE = 10;

export default async function OrderHistoryPage({ searchParams }) {
  const session = await getSession();
  if (session?.role !== "customer") {
    redirect("/signin?next=%2Forders");
  }

  const { page: pageParam, sortBy: sortParam, sortDir: dirParam } = await searchParams;

  // Validate sort parameters against the allowlist — reject anything unknown.
  const sortBy  = ALLOWED_SORT_FIELDS.has(sortParam)  ? sortParam  : "createdAt";
  const sortDir = ALLOWED_SORT_DIRS.has(dirParam)      ? dirParam   : "desc";

  // Fetch all orders for this user (already filtered by userId in lib).
  const allOrders = getOrdersByUserId(session.id);

  // Sort
  const sorted = [...allOrders].sort((a, b) => {
    let diff;
    if (sortBy === "total") {
      diff = (a.total ?? 0) - (b.total ?? 0);
    } else if (sortBy === "status") {
      diff = a.status.localeCompare(b.status);
    } else {
      // default: createdAt
      diff = new Date(a.createdAt) - new Date(b.createdAt);
    }
    return sortDir === "asc" ? diff : -diff;
  });

  // Pagination — clamp page to valid range.
  const requestedPage = Number(pageParam) || 1;
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const orders = sorted.slice(start, start + PAGE_SIZE);

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Your account
          </p>
          <h1 className="mt-3 text-4xl font-black text-stone-900">Order history</h1>
          <p className="mt-3 text-stone-600">
            {allOrders.length === 0
              ? "No orders placed yet."
              : `${allOrders.length} order${allOrders.length === 1 ? "" : "s"} · newest first by default`}
          </p>
        </div>
        {allOrders.length > 0 ? (
          <form action="/api/orders/export" method="get">
            <button
              type="submit"
              className="rounded-full bg-amber-700 px-5 py-3 font-semibold text-white transition hover:bg-amber-800"
            >
              Download CSV
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-8">
        <OrderTable
          orders={orders}
          page={page}
          totalPages={totalPages}
          sortBy={sortBy}
          sortDir={sortDir}
        />
      </div>
    </section>
  );
}
