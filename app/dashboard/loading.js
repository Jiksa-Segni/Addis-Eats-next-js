/**
 * Task 33 — Dashboard loading skeleton.
 */
export default function DashboardLoading() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
      <div className="mt-3 h-10 w-48 animate-pulse rounded-lg bg-stone-200" />
      <div className="mt-3 h-4 w-72 animate-pulse rounded bg-stone-200" />

      {/* Summary cards skeleton */}
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <div className="h-3 w-28 animate-pulse rounded bg-stone-200" />
            <div className="mt-3 h-8 w-36 animate-pulse rounded-lg bg-stone-200" />
            <div className="mt-1 h-3 w-24 animate-pulse rounded bg-stone-200" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="mt-10 h-80 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-stone-200" />
    </section>
  );
}
