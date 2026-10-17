import Link from "next/link";
import { redirect } from "next/navigation";
import { changeDishAvailability, createDish, deleteDish } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { getAllDishes } from "@/lib/dishes";

export const dynamic = "force-dynamic";

const resultMessages = {
  added: "Item added to the menu.",
  enabled: "Item enabled and available to customers.",
  disabled: "Item disabled and hidden from customers.",
  removed: "Item removed from the menu.",
};

export default async function ItemManagementPage({ searchParams }) {
  const session = await getSession();
  if (session?.role !== "admin") {
    redirect(session ? "/" : "/signin?next=%2Fkitchen%2Fitems");
  }

  const [{ result }, items] = await Promise.all([searchParams, getAllDishes()]);
  const availableCount = items.filter((item) => item.isAvailable).length;
  const disabledCount = items.length - availableCount;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Admin area</p>
          <h1 className="mt-3 text-4xl font-black text-stone-900">Item management</h1>
          <p className="mt-3 text-stone-600">Add menu items, control availability, and review the full item report.</p>
        </div>
        <Link href="/kitchen" className="rounded-full border border-stone-300 px-5 py-3 font-semibold text-stone-800 hover:border-stone-500">
          Back to kitchen
        </Link>
      </div>

      {typeof result === "string" && resultMessages[result] ? (
        <p role="status" className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {resultMessages[result]}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["All items", items.length],
          ["Enabled", availableCount],
          ["Disabled", disabledCount],
        ].map(([label, count]) => (
          <div key={label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
            <p className="text-sm font-semibold text-stone-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-stone-900">{count}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
        <h2 className="text-2xl font-bold text-stone-900">Add a menu item</h2>
        <form action={createDish} className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-stone-700">
            Item name
            <input name="name" required minLength={2} maxLength={80} className="mt-2 w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3" />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Price (ETB)
            <input name="price" type="number" required min="0.01" max="100000" step="0.01" className="mt-2 w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3" />
          </label>
          <label className="block text-sm font-medium text-stone-700 md:col-span-2">
            Description
            <textarea name="description" required minLength={5} maxLength={500} rows={3} className="mt-2 w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3" />
          </label>
          <label className="block text-sm font-medium text-stone-700 md:col-span-2">
            Image path <span className="font-normal text-stone-500">(optional; use a file from /images/; defaults to Doro Wet)</span>
            <input name="image" maxLength={500} placeholder="/images/dorowet.jpg" className="mt-2 w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3" />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="rounded-full bg-amber-700 px-6 py-3 font-semibold text-white transition hover:bg-amber-800">
              Add item
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">All items report</h2>
          <p className="mt-2 text-sm text-stone-600">Includes enabled and disabled items. Removed items are not included.</p>
        </div>
        <form action="/api/dishes/report" method="get">
          <button type="submit" className="rounded-full bg-stone-900 px-5 py-3 font-semibold text-white transition hover:bg-stone-700">
            Download all-items CSV
          </button>
        </form>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-stone-100 text-stone-600">
            <tr>
              <th scope="col" className="px-5 py-4 font-semibold">Item</th>
              <th scope="col" className="px-5 py-4 font-semibold">Price</th>
              <th scope="col" className="px-5 py-4 font-semibold">Availability</th>
              <th scope="col" className="px-5 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-4">
                  <p className="font-semibold text-stone-900">{item.name}</p>
                  <p className="mt-1 max-w-lg text-stone-600">{item.description}</p>
                  <p className="mt-1 font-mono text-xs text-stone-400">{item.id}</p>
                </td>
                <td className="px-5 py-4 font-semibold text-stone-800">{item.price} ETB</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isAvailable ? "bg-green-50 text-green-800" : "bg-stone-100 text-stone-600"}`}>
                    {item.isAvailable ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <form action={changeDishAvailability}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="isAvailable" value={String(!item.isAvailable)} />
                      <button type="submit" className="rounded-full border border-amber-700 px-4 py-2 font-semibold text-amber-900 hover:bg-amber-50">
                        {item.isAvailable ? "Disable" : "Enable"}
                      </button>
                    </form>
                    <form action={deleteDish}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="rounded-full border border-red-300 px-4 py-2 font-semibold text-red-800 hover:bg-red-50">
                        Remove
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-stone-600">There are no menu items.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
