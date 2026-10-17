/**
 * Task 30 — Dashboard page (server component).
 *
 * Aggregates real order and revenue data on the server, then passes it to
 * the client-side chart components. Requires admin sign-in.
 *
 * Revenue rules:
 * - Only orders with status "completed" count as realised revenue.
 * - Cancelled orders are excluded.
 * - Received, preparing, and ready orders are shown as pending revenue
 *   in the table but not in the bar chart totals.
 *
 * Neighbourhoods are derived from the delivery addresses stored in orders,
 * which match the dropdown options on the checkout form:
 *   Bole Michael, Bole Road, Kazanchis, Megenagna, Piazza,
 *   Ayer Tena, Saris, CMC
 */
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOrders } from "@/lib/orders";
import RevenueChart from "./RevenueChart";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
  description: "Addis Eats sales dashboard — revenue by neighbourhood and orders over time.",
  robots: { index: false, follow: false },
};

/** Extract the neighbourhood label from a full address string. */
function parseNeighbourhood(address) {
  if (!address) return "Unknown";
  // Addresses are formatted as "Neighbourhood, Addis Ababa"
  return address.split(",")[0].trim();
}

/** Format a date string to YYYY-MM-DD for grouping purposes. */
function toDateKey(isoString) {
  return isoString ? isoString.slice(0, 10) : "unknown";
}

export default async function DashboardPage() {
  const session = await getSession();
  if (session?.role !== "admin") {
    redirect(session ? "/" : "/signin?next=%2Fdashboard");
  }

  const allOrders = getOrders();

  // ── Revenue by neighbourhood (completed orders only) ────────────────────
  const revenueByNeighbourhood = {};
  for (const order of allOrders) {
    if (order.status !== "completed") continue;
    const neighbourhood = parseNeighbourhood(order.address);
    revenueByNeighbourhood[neighbourhood] =
      (revenueByNeighbourhood[neighbourhood] ?? 0) + (order.total ?? 0);
  }
  const neighbourhoodData = Object.entries(revenueByNeighbourhood)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── Orders over time (all non-cancelled orders, grouped by day) ──────────
  const ordersByDay = {};
  for (const order of allOrders) {
    if (order.status === "cancelled") continue;
    const day = toDateKey(order.createdAt);
    ordersByDay[day] = (ordersByDay[day] ?? 0) + 1;
  }
  const ordersOverTime = Object.entries(ordersByDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Summary statistics ───────────────────────────────────────────────────
  const totalRevenue = allOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  const pendingOrders = allOrders.filter((o) =>
    ["received", "preparing", "ready"].includes(o.status)
  ).length;

  const totalOrders = allOrders.filter((o) => o.status !== "cancelled").length;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Staff area
      </p>
      <h1 className="mt-3 text-4xl font-black text-stone-900">Dashboard</h1>
      <p className="mt-3 text-stone-600">
        Revenue and order activity across all Addis Eats neighbourhoods.
      </p>

      {/* ── Summary cards ── */}
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
            Total revenue
          </p>
          <p className="mt-3 text-3xl font-black text-stone-900">
            {totalRevenue.toLocaleString()} ETB
          </p>
          <p className="mt-1 text-sm text-stone-500">Completed orders only</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
            Total orders
          </p>
          <p className="mt-3 text-3xl font-black text-stone-900">{totalOrders}</p>
          <p className="mt-1 text-sm text-stone-500">Excludes cancelled</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
            Pending
          </p>
          <p className="mt-3 text-3xl font-black text-stone-900">{pendingOrders}</p>
          <p className="mt-1 text-sm text-stone-500">Received, preparing, or ready</p>
        </div>
      </div>

      {/* ── Charts (client component) ── */}
      <div className="mt-10">
        {neighbourhoodData.length === 0 && ordersOverTime.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-stone-600 ring-1 ring-stone-200">
            No completed orders yet. Charts will appear once orders are fulfilled.
          </div>
        ) : (
          <RevenueChart
            neighbourhoodData={neighbourhoodData}
            ordersOverTime={ordersOverTime}
          />
        )}
      </div>

      {/* ── Accessible data table (text fallback for charts) ── */}
      {neighbourhoodData.length > 0 ? (
        <div className="mt-10 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
          <table className="w-full text-left text-sm">
            <caption className="px-6 pt-5 pb-2 text-left text-base font-bold text-stone-900">
              Revenue by neighbourhood (completed orders)
            </caption>
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th scope="col" className="px-6 py-3">Neighbourhood</th>
                <th scope="col" className="px-6 py-3 text-right">Revenue (ETB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {neighbourhoodData.map((row) => (
                <tr key={row.name} className="hover:bg-stone-50">
                  <td className="px-6 py-3 font-medium text-stone-900">{row.name}</td>
                  <td className="px-6 py-3 text-right text-stone-700">
                    {row.revenue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
