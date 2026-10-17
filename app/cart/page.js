"use client";

import Link from "next/link";
import { useCartFavorites } from "../providers";

// Cart is account-specific and transactional — not indexed by search engines.
export const dynamic = "force-dynamic";

export default function CartPage() {
  const { cart, totalPrice, updateQuantity, removeFromCart } = useCartFavorites();

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Cart</p>
        <h1 className="mt-3 text-4xl font-black text-stone-900">Your cart</h1>

        <div className="mt-8 space-y-4">
          {cart.length === 0 ? (
            <p className="text-stone-600">Your cart is currently empty.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-2xl bg-stone-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="block font-medium text-stone-800">{item.name}</span>
                  <span className="text-sm text-stone-600">{item.price} ETB each</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-2 py-1">
                    <button
                      type="button"
                      aria-label={`Decrease quantity for ${item.name}`}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="h-8 w-8 rounded-full text-lg text-stone-700 hover:bg-stone-100"
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center font-semibold text-stone-900">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase quantity for ${item.name}`}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="h-8 w-8 rounded-full text-lg text-stone-700 hover:bg-stone-100"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                  <span className="font-bold text-stone-900">{item.price * item.quantity} ETB</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-stone-200 pt-5 text-lg font-bold">
          <span>Total</span>
          <span>{totalPrice} ETB</span>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/menu" className="rounded-full border border-stone-300 px-5 py-3 font-semibold text-stone-800 transition hover:border-stone-500">
            Browse menu
          </Link>
          <Link href="/checkout" className="rounded-full bg-amber-700 px-5 py-3 font-semibold text-white transition hover:bg-amber-800">
            Go to checkout
          </Link>
        </div>
      </div>
    </section>
  );
}
