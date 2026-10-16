import Link from "next/link";

const menuCategories = [
  { href: "/menu", label: "All dishes" },
  { href: "/menu/1", label: "Doro Wet" },
  { href: "/menu/2", label: "Kitfo" },
  { href: "/menu/3", label: "Shiro" },
];

export default function MenuLayout({ children }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Explore</p>
        <h2 className="mt-3 text-2xl font-bold text-stone-900">Menu</h2>

        <nav className="mt-5 space-y-2">
          {menuCategories.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-amber-50 hover:text-amber-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="min-w-0">{children}</section>
    </div>
  );
}
