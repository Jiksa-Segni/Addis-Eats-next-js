import Link from "next/link";
import Image from "next/image";
import { getDishes } from "@/lib/dishes";
import { createPageMetadata, jsonLd, shareImage, siteUrl } from "./seo";

export const metadata = createPageMetadata({
  title: "Ethiopian Food in Addis Ababa",
  description:
    "Enjoy authentic Ethiopian food in Addis Ababa. Explore Doro Wet, Kitfo, Shiro, Tibs, and more, freshly prepared at Addis Eats.",
  path: "/",
  imageAlt: "Ethiopian Doro Wet at Addis Eats restaurant in Addis Ababa",
});

export default async function HomePage() {
  const availableDishes = await getDishes();
  const featuredDish = availableDishes[0];
  const restaurantSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Restaurant",
        "@id": `${siteUrl}/#restaurant`,
        name: "Addis Eats",
        url: siteUrl,
        image: new URL(shareImage, siteUrl).toString(),
        description:
          "Authentic Ethiopian food in Addis Ababa, including Doro Wet, Kitfo, Shiro, and Tibs.",
        servesCuisine: "Ethiopian",
        telephone: "+251112223344",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Bole Road, near the city center",
          addressLocality: "Addis Ababa",
          addressCountry: "ET",
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "09:00",
          closes: "23:00",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Addis Eats",
        description:
          "Discover authentic Ethiopian food in Addis Ababa and order freshly prepared favorites online.",
        inLanguage: "en",
        publisher: { "@id": `${siteUrl}/#restaurant` },
      },
    ],
  };

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(restaurantSchema)}
      />
      <div className="grid items-center gap-8 rounded-3xl bg-gradient-to-br from-amber-100 via-orange-50 to-red-50 p-8 shadow-lg md:grid-cols-2 md:p-12">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Fresh Ethiopian flavors
          </p>
          <h1 className="text-4xl font-black tracking-tight text-stone-900 md:text-6xl">
            Addis Eats
          </h1>
          <p className="mt-4 max-w-xl text-lg text-stone-700">
            Comforting stews, colorful platters, and slow-cooked classics—served with a warm welcome and a modern dining experience.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/menu" className="rounded-full bg-amber-700 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-amber-800">
              Explore the menu
            </Link>
            <Link href="/about" className="rounded-full border border-stone-300 bg-white px-6 py-3 font-semibold text-stone-800 transition hover:border-stone-400">
              Learn our story
            </Link>
          </div>
        </div>

        {featuredDish ? (
        <div className="rounded-2xl bg-stone-900 p-6 text-white shadow-xl">
          <Image
            src={featuredDish.image}
            alt={featuredDish.name}
            width={640}
            height={420}
            priority
            className="mb-6 h-56 w-full rounded-xl object-cover"
          />
          <p className="text-sm uppercase tracking-[0.2em] text-amber-300">Today&apos;s highlight</p>
          <h2 className="mt-3 text-3xl font-bold">{featuredDish.name}</h2>
          <p className="mt-3 text-stone-200">
            {featuredDish.description}
          </p>
          <div className="mt-6 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
            <span>Price</span>
            <span className="text-xl font-bold text-amber-300">{featuredDish.price} ETB</span>
          </div>
        </div>
        ) : (
          <div className="rounded-2xl bg-stone-900 p-6 text-white shadow-xl">
            <p className="text-lg font-bold">Our menu is being refreshed.</p>
            <p className="mt-3 text-stone-200">Please check back soon for today&apos;s available dishes.</p>
          </div>
        )}
      </div>

      <div id="contact" className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Contact</p>
        <h2 className="mt-3 text-3xl font-black text-stone-900">Visit or call Addis Eats</h2>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-stone-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Location</p>
            <p className="mt-3 text-lg font-bold text-stone-900">Addis Ababa, Ethiopia</p>
            <p className="mt-2 text-stone-600">Bole Road, near the city center</p>
          </div>

          <div className="rounded-2xl bg-stone-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Phone</p>
            <p className="mt-3 text-lg font-bold text-stone-900">+251 11 222 3344</p>
            <p className="mt-2 text-stone-600">Open for orders and reservations</p>
          </div>

          <div className="rounded-2xl bg-stone-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Hours</p>
            <p className="mt-3 text-lg font-bold text-stone-900">Mon–Sun</p>
            <p className="mt-2 text-stone-600">9:00 AM – 11:00 PM</p>
          </div>
        </div>
      </div>
    </section>
  );
}