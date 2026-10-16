"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartFavorites } from "./providers";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/menu", label: "Menu" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
  { href: "/kitchen", label: "Kitchen" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { user, totalItems, signOut } = useCartFavorites();

  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-xl font-black tracking-wide text-amber-700">
          Addis Eats
        </Link>

        <div className="hidden items-center gap-3 text-sm font-medium text-stone-700 md:flex md:gap-5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition hover:text-amber-700 ${pathname === item.href ? "text-amber-700" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm font-medium text-stone-700">
          <Link href="/cart" className="rounded-full bg-stone-100 px-3 py-2 transition hover:bg-stone-200">
            Cart ({totalItems})
          </Link>

          {user ? (
            <>
              <span className="hidden sm:inline">Hi, {user.name}</span>
              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-stone-300 px-3 py-2 transition hover:border-stone-500"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/signin" className="rounded-full bg-amber-700 px-4 py-2 font-semibold text-white transition hover:bg-amber-800">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
