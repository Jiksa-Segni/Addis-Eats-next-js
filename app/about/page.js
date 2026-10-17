import { createPageMetadata } from "../seo";

export const metadata = createPageMetadata({
  title: "About Our Ethiopian Restaurant",
  description:
    "Learn the story behind Addis Eats, bringing the warmth of Ethiopian hospitality and freshly prepared traditional dishes to Addis Ababa.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Our story</p>
      <h1 className="mt-4 text-4xl font-black text-stone-900">A taste of home, served with care.</h1>
      <p className="mt-6 text-lg leading-8 text-stone-700">
        Addis Eats was created to bring the warmth of Ethiopian hospitality into everyday dining. From slow-simmered stews to fresh injera and aromatic coffee, every plate celebrates tradition with a modern touch.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-xl font-bold">Traditional</h2>
          <p className="mt-2 text-stone-600">Authentic recipes shaped by generations of Ethiopian cooking.</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-xl font-bold">Fresh</h2>
          <p className="mt-2 text-stone-600">Every ingredient is prepared daily for the best flavor and quality.</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-xl font-bold">Welcoming</h2>
          <p className="mt-2 text-stone-600">We serve every guest as if they are joining our family table.</p>
        </div>
      </div>
    </article>
  );
}
