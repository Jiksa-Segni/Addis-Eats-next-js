/**
 * Task 33 — Loading state for the orders section.
 *
 * Next.js shows this skeleton automatically while the orders page and its
 * server component tree are streaming in.
 */
export default function OrdersLoading() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12" aria-busy="true" aria-label="Loading orders">
      <div className="h-6 w-32 animate-pulse rounded bg-stone-200" />
      <div className="mt-3 h-10 w-56 animate-pulse rounded-lg bg-stone-200" />
      <div className="mt-3 h-4 w-48 animate-pulse rounded bg-stone-200" />

      <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-stone-100 px-6 py-4"
          >
            <div className="h-4 w-20 animate-pulse rounded bg-stone-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-stone-200" />
            <div className="h-4 flex-1 animate-pulse rounded bg-stone-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
          </div>
        ))}
      </div>
    </section>
  );
}
