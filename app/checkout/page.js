"use client";

import Link from "next/link";
import { useActionState } from "react";
import { placeOrder } from "@/app/actions";

const initialState = { success: false, message: "", orderId: null, fieldErrors: {} };

export default function CheckoutPage() {
  const currentTime = new Date().toLocaleString();
  const [state, formAction, pending] = useActionState(placeOrder, initialState);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Checkout</p>
        <h1 className="mt-3 text-4xl font-black text-stone-900">Place your order</h1>
        <p className="mt-3 text-stone-600">Freshly prepared meals for delivery or pickup.</p>

        {state.message ? (
          <p
            role="status"
            className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
              state.success
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {state.message}
          </p>
        ) : null}
        {state.success && state.orderId ? (
          <Link
            href={`/orders/${state.orderId}`}
            className="mt-4 inline-block font-semibold text-amber-800 underline"
          >
            Track your order
          </Link>
        ) : null}

        <form action={formAction} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block font-medium text-stone-700">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500"
              placeholder="Enter your full name"
            />
            {state.fieldErrors?.name?.map((message) => (
              <p key={message} className="mt-2 text-sm text-red-700">
                {message}
              </p>
            ))}
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block font-medium text-stone-700">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500"
              placeholder="09xxxxxxxx or +2519xxxxxxxx"
            />
            {state.fieldErrors?.phone?.map((message) => (
              <p key={message} className="mt-2 text-sm text-red-700">
                {message}
              </p>
            ))}
          </div>

          <div>
            <label htmlFor="address" className="mb-2 block font-medium text-stone-700">
              Delivery Address
            </label>
            <select
              id="address"
              name="address"
              required
              defaultValue=""
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500"
            >
              <option value="" disabled>
                Select your delivery address
              </option>
              <option value="Bole Michael, Addis Ababa">Bole Michael, Addis Ababa</option>
              <option value="Bole Road, Addis Ababa">Bole Road, Addis Ababa</option>
              <option value="Kazanchis, Addis Ababa">Kazanchis, Addis Ababa</option>
              <option value="Megenagna, Addis Ababa">Megenagna, Addis Ababa</option>
              <option value="Piazza, Addis Ababa">Piazza, Addis Ababa</option>
              <option value="Ayer Tena, Addis Ababa">Ayer Tena, Addis Ababa</option>
              <option value="Saris, Addis Ababa">Saris, Addis Ababa</option>
              <option value="CMC, Addis Ababa">CMC, Addis Ababa</option>
            </select>
            {state.fieldErrors?.address?.map((message) => (
              <p key={message} className="mt-2 text-sm text-red-700">
                {message}
              </p>
            ))}
          </div>

          <div>
            <label htmlFor="notes" className="mb-2 block font-medium text-stone-700">
              Order Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows="4"
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500"
              placeholder="No onions, extra spicy, etc."
            />
            {state.fieldErrors?.notes?.map((message) => (
              <p key={message} className="mt-2 text-sm text-red-700">
                {message}
              </p>
            ))}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-green-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Placing Order..." : "Place Order"}
          </button>
        </form>
      </section>

      <aside className="rounded-3xl bg-stone-900 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Live summary</p>
        <h2 className="mt-4 text-2xl font-bold">Order recap</h2>

        <div className="mt-6 space-y-4 text-sm text-stone-200">
          <div className="flex items-center justify-between border-b border-stone-700 pb-3">
            <span>Doro Wet</span>
            <span>450 ETB</span>
          </div>
          <div className="flex items-center justify-between border-b border-stone-700 pb-3">
            <span>Delivery</span>
            <span>50 ETB</span>
          </div>
          <div className="flex items-center justify-between pt-2 text-lg font-bold text-white">
            <span>Total</span>
            <span>500 ETB</span>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-white/10 p-4 text-sm text-stone-200">
          <p className="font-semibold text-white">Last refreshed</p>
          <p className="mt-2">{currentTime}</p>
        </div>

        <Link href="/cart" className="mt-8 inline-block text-sm font-semibold text-amber-300 underline">
          Back to cart
        </Link>
      </aside>
    </div>
  );
}
