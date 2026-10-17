import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getDishById, getDishes } from "@/lib/dishes";
import { siteUrl } from "@/app/layout";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const dishes = await getDishes();
  return dishes.map((dish) => ({ id: dish.id }));
}

/**
 * Task 19 — Dynamic dish metadata.
 * Uses the same dish object as the page render so titles and descriptions
 * are always consistent with what the visitor actually sees.
 */
export async function generateMetadata({ params }) {
  const { id } = await params;
  const dish = await getDishById(id);

  if (!dish) {
    // Next.js will call notFound() from the page component; return minimal metadata here.
    return { title: "Dish not found" };
  }

  const canonicalUrl = new URL(`/menu/${dish.id}`, siteUrl).toString();
  const absoluteImage = new URL(dish.image, siteUrl).toString();

  return {
    title: dish.name,
    description: `${dish.description} — ${dish.price} ETB. Order ${dish.name} online from Addis Eats in Addis Ababa.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      title: `${dish.name} — ${dish.price} ETB | Addis Eats`,
      description: `${dish.description} Order online from Addis Eats, Addis Ababa.`,
      url: canonicalUrl,
      images: [
        {
          url: absoluteImage,
          width: 960,
          height: 600,
          alt: `${dish.name} served at Addis Eats`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${dish.name} — ${dish.price} ETB | Addis Eats`,
      description: `${dish.description} Order online from Addis Eats, Addis Ababa.`,
      images: [absoluteImage],
    },
  };
}

export default async function DishPage({ params }) {
  const { id } = await params;
  const dish = await getDishById(id);

  if (!dish) {
    notFound();
  }

  // Task 22 — MenuItem JSON-LD structured data.
  // Generated entirely from the trusted server-side dish record —
  // never from client input — and safely serialised via JSON.stringify.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: dish.name,
    description: dish.description,
    image: new URL(dish.image, siteUrl).toString(),
    url: new URL(`/menu/${dish.id}`, siteUrl).toString(),
    offers: {
      "@type": "Offer",
      price: String(dish.price),
      priceCurrency: "ETB",
    },
  };

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
      {/* JSON-LD injected into the page <head> via Next.js script tag */}
      <script
        type="application/ld+json"
        // JSON.stringify escapes </script> sequences, preventing script injection.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Image
        src={dish.image}
        alt={dish.name}
        width={960}
        height={600}
        priority
        className="mb-8 h-72 w-full rounded-2xl object-cover"
      />
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Featured dish</p>
      <h1 className="mt-3 text-4xl font-black text-stone-900">{dish.name}</h1>
      <p className="mt-4 max-w-2xl text-lg text-stone-600">{dish.description}</p>

      <div className="mt-6 flex items-center gap-4">
        <span className="text-3xl font-black text-stone-900">{dish.price} ETB</span>
        <Link href="/menu" className="rounded-full border border-stone-300 px-4 py-2 font-semibold text-stone-800 transition hover:border-stone-500">
          Back to menu
        </Link>
      </div>
    </article>
  );
}
