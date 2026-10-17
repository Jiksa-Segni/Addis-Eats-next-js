import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getDishById, getDishes } from "@/lib/dishes";
import { jsonLd, siteUrl } from "../../seo";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const dishes = await getDishes();
  return dishes.map((dish) => ({ id: dish.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const dish = await getDishById(id);
  if (!dish) {
    return {};
  }

  const title = `${dish.name} | Ethiopian Dish`;
  const description = `${dish.description} Order ${dish.name} freshly prepared at Addis Eats in Addis Ababa.`;
  const imageUrl = new URL(dish.image, siteUrl).toString();

  return {
    title,
    description,
    alternates: {
      canonical: `/menu/${dish.id}`,
    },
    openGraph: {
      type: "website",
      title: `${title} | Addis Eats`,
      description,
      url: `/menu/${dish.id}`,
      images: [{ url: imageUrl, alt: `${dish.name}, freshly prepared at Addis Eats` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Addis Eats`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function DishPage({ params }) {
  const { id } = await params;
  const dish = await getDishById(id);

  if (!dish) {
    notFound();
  }

  const dishSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: dish.name,
    description: dish.description,
    image: new URL(dish.image, siteUrl).toString(),
    offers: {
      "@type": "Offer",
      price: dish.price,
      priceCurrency: "ETB",
      availability: "https://schema.org/InStock",
      url: new URL(`/menu/${dish.id}`, siteUrl).toString(),
      seller: {
        "@type": "Restaurant",
        name: "Addis Eats",
        url: siteUrl,
      },
    },
  };

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(dishSchema)} />
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
