import { updateKitchenOrderStatus } from "../actions";
import { getSession } from "@/lib/auth";
import { getOrders } from "@/lib/orders";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const nextStatuses = {
  received:   ["preparing", "cancelled"],
  preparing:  ["ready", "cancelled"],
  ready:      ["on_the_way", "cancelled"],
  on_the_way: ["delivered"],
  delivered:  ["completed"],
  completed:  [],
  cancelled:  [],
};

const STATUS_BADGE_COLORS = {
  received:   "bg-blue-50 text-blue-800",
  preparing:  "bg-amber-50 text-amber-900",
  ready:      "bg-green-50 text-green-900",
  on_the_way: "bg-purple-50 text-purple-900",
  delivered:  "bg-teal-50 text-teal-900",
  completed:  "bg-stone-100 text-stone-700",
  cancelled:  "bg-red-50 text-red-800",
};

export default async function KitchenPage() {
  const session = await getSession();
  if (session?.role !== "admin") {
    redirect(session ? "/" : "/signin?next=%2Fkitchen");
  }

  const orders = getOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Staff area</p>
      <h1 className="mt-3 text-4xl font-black text-stone-900">Kitchen</h1>
      <p className="mt-3 text-stone-600">View incoming orders and move them through the kitchen workflow.</p>
      <Link href="/kitchen/items" className="mt-5 inline-block rounded-full bg-amber-700 px-5 py-3 font-semibold text-white transition hover:bg-amber-800">
        Manage menu items
      </Link>

      <div className="mt-8 space-y-5">
        {orders.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-stone-600 ring-1 ring-stone-200">
            No orders yet. New customer orders will appear here.
          </div>
        ) : null}

        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm font-bold text-stone-800">Order {order.id.slice(0, 8)}</p>
                <p className="mt-2 text-lg font-bold text-stone-900">{order.name}</p>
                <p className="mt-1 text-sm text-stone-600">{order.phone}</p>
                <p className="mt-1 text-sm text-stone-600">{order.address}</p>
              </div>
              <span className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${STATUS_BADGE_COLORS[order.status] ?? "bg-amber-50 text-amber-900"}`}>
                {order.status.replace("_", " ")}
              </span>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-stone-700">
              {order.items?.length ? (
                order.items.map((item) => (
                  <li key={`${order.id}-${item.name}`}>
                    {item.quantity} × {item.name} — {item.total ?? item.price * item.quantity} ETB
                  </li>
                ))
              ) : (
                <li>Order details are being prepared.</li>
              )}
            </ul>

            {order.notes ? <p className="mt-3 text-sm text-stone-600">Notes: {order.notes}</p> : null}
            <p className="mt-3 font-bold text-stone-900">Total: {order.total ?? 0} ETB</p>

            {nextStatuses[order.status]?.length ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {nextStatuses[order.status].map((status) => (
                  <form key={status} action={async () => {
                    "use server";
                    await updateKitchenOrderStatus(order.id, status);
                  }}>
                    <button
                      type="submit"
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        status === "cancelled"
                          ? "border border-red-300 text-red-800 hover:bg-red-50"
                          : "bg-amber-700 text-white hover:bg-amber-800"
                      }`}
                    >
                      Mark {status.replace("_", " ")}
                    </button>
                  </form>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
