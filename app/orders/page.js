import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getOrdersByUserId } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function OrderHistoryPage() {
  const session = await getSession();
  if (session?.role !== "customer") {
    redirect("/signin?next=%2Forders");
  }

  const orders = getOrdersByUserId(session.id);

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Your account</p>
          <h1 className="mt-3 text-4xl font-black text-stone-900">Order history</h1>
          <p className="mt-3 text-stone-600">Your newest orders appear first.</p>
        </div>
        {orders.length ? (
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

      <div className="mt-8 space-y-5">
        {orders.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-stone-600 ring-1 ring-stone-200">
            <p>You have not placed any orders yet.</p>
            <Link href="/menu" className="mt-4 inline-block font-semibold text-amber-800 underline">
              Browse the menu
            </Link>
          </div>
        ) : null}

        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm font-bold text-stone-800">Order {order.id.slice(0, 8)}</p>
                <time dateTime={order.createdAt} className="mt-2 block text-sm text-stone-600">
                  {new Date(order.createdAt).toLocaleString()}
                </time>
              </div>
              <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold capitalize text-amber-900">
                {order.status}
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-stone-700">
              {order.items.map((item) => (
                <li key={`${order.id}-${item.id}`}>
                  {item.quantity} × {item.name} — {item.total} ETB
                </li>
              ))}
            </ul>
            <p className="mt-4 font-bold text-stone-900">Total: {order.total} ETB</p>
            <Link href={`/orders/${order.id}`} className="mt-3 inline-block font-semibold text-amber-800 underline">
              Track this order
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
